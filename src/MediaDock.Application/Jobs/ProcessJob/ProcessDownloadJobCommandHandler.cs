using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Application.Ports.Notifications;
using MediaDock.Application.Ports.Progress;
using MediaDock.Domain.Jobs;
using MediaDock.Domain.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace MediaDock.Application.Jobs.ProcessJob;

public sealed class ProcessDownloadJobCommandHandler(
    IJobRepository jobs,
    IMediaProbe probe,
    IMediaDownloader downloader,
    IJobProgressPublisher progress,
    IDownloadsPathResolver downloadPaths,
    IInAppNotificationRepository notifications,
    ILogger<ProcessDownloadJobCommandHandler> logger) : IRequestHandler<ProcessDownloadJobCommand>
{
    public async Task Handle(ProcessDownloadJobCommand request, CancellationToken cancellationToken)
    {
        var job = await jobs.GetByIdAsync(request.JobId, cancellationToken);
        if (job is null)
        {
            logger.LogWarning("Job {JobId} not found", request.JobId);
            return;
        }

        if (!await jobs.TryTransitionAsync(job.Id, JobStatus.Queued, JobStatus.Probing, null, cancellationToken))
        {
            logger.LogInformation("Job {JobId} could not enter Probing (state changed?)", request.JobId);
            return;
        }

        await jobs.SaveChangesAsync(cancellationToken);

        try
        {
            var parsed = JobSpecJson.Parse(job.CurrentSpec?.SpecJson);
            await probe.ProbeAsync(job.Url, cancellationToken);
            await jobs.UpsertProgressAsync(job.Id, "probed", null, null, cancellationToken);
            await progress.PublishAsync(
                new JobProgressDto(job.Id, "probed", null, null, null, DateTime.UtcNow),
                cancellationToken);

            if (!await jobs.TryTransitionAsync(job.Id, JobStatus.Probing, JobStatus.Downloading, null, cancellationToken))
                return;
            await jobs.SaveChangesAsync(cancellationToken);

            var workDir = await downloadPaths.GetDownloadsRootAsync(cancellationToken);
            Directory.CreateDirectory(workDir);
            var pathsBeforeDownload = SnapshotTopLevelPaths(workDir);
            var downloadStartedUtc = DateTime.UtcNow;
            logger.LogInformation("Job {JobId} downloads root (flat): {WorkDir}", job.Id, workDir);

            var downloadSpec = new DownloadSpec(
                job.Id,
                job.Url,
                workDir,
                FormatSelector: parsed.FormatSelector,
                ProxyUrl: null,
                CookiesFilePath: parsed.CookiesFilePath,
                WriteSubtitles: parsed.WriteSubtitles,
                WriteThumbnail: parsed.WriteThumbnail);

            await foreach (var ev in downloader.DownloadAsync(downloadSpec, cancellationToken))
            {
                await jobs.UpsertProgressAsync(
                    job.Id,
                    ev.Phase,
                    ev.BytesDone,
                    ev.BytesTotal,
                    cancellationToken);
                await progress.PublishAsync(
                    new JobProgressDto(
                        job.Id,
                        ev.Phase,
                        ev.Percent,
                        ev.BytesDone,
                        ev.BytesTotal,
                        DateTime.UtcNow),
                    cancellationToken);
            }

            var artifacts = BuildArtifactsFromDownloadDelta(job.Id, workDir, pathsBeforeDownload, downloadStartedUtc);
            await jobs.ReplaceArtifactsAsync(job.Id, artifacts, cancellationToken);

            if (!await jobs.TryTransitionAsync(job.Id, JobStatus.Downloading, JobStatus.Completed, null, cancellationToken))
                return;

            job.CompletedAt = DateTime.UtcNow;
            await jobs.SaveChangesAsync(cancellationToken);

            await NotifyAsync(
                job.Id,
                "success",
                "Download completed",
                $"{job.Url}\nJob {job.Id}",
                cancellationToken);
        }
        catch (OperationCanceledException)
        {
            await jobs.ForceStatusAsync(job.Id, JobStatus.Paused, "cancelled", null, cancellationToken);
            await NotifyAsync(
                job.Id,
                "warn",
                "Job paused",
                $"{job.Url} — cancelled",
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job {JobId} failed", job.Id);
            await jobs.ForceStatusAsync(job.Id, JobStatus.Failed, ex.Message, ex.GetType().Name, cancellationToken);
            await NotifyAsync(
                job.Id,
                "error",
                "Download failed",
                $"{job.Url}\n{ex.Message}",
                cancellationToken);
        }
    }

    private async Task NotifyAsync(Guid jobId, string type, string title, string body, CancellationToken cancellationToken)
    {
        try
        {
            await notifications.AddAsync(
                new InAppNotification
                {
                    Id = Guid.CreateVersion7(),
                    JobId = jobId,
                    Type = type,
                    Title = title,
                    Body = body,
                    CreatedAt = DateTime.UtcNow
                },
                cancellationToken);
        }
        catch
        {
            /* avoid failing the job pipeline on notification errors */
        }
    }

    private static HashSet<string> SnapshotTopLevelPaths(string dir)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!Directory.Exists(dir))
            return set;
        foreach (var path in Directory.EnumerateFiles(dir, "*", SearchOption.TopDirectoryOnly))
            set.Add(Path.GetFullPath(path));
        return set;
    }

    /// <summary>
    /// With a flat downloads directory, only attribute files that were created or updated during this run.
    /// </summary>
    private static IReadOnlyList<JobArtifact> BuildArtifactsFromDownloadDelta(
        Guid jobId,
        string workDir,
        HashSet<string> pathsBeforeDownload,
        DateTime downloadStartedUtc)
    {
        var list = new List<JobArtifact>();
        if (!Directory.Exists(workDir))
            return list;

        var startedFloor = downloadStartedUtc.AddSeconds(-5);

        foreach (var path in Directory.EnumerateFiles(workDir, "*", SearchOption.TopDirectoryOnly))
        {
            var full = Path.GetFullPath(path);
            var name = Path.GetFileName(full);
            if (name.StartsWith(".", StringComparison.Ordinal))
                continue;

            FileInfo fi;
            try
            {
                fi = new FileInfo(full);
            }
            catch
            {
                continue;
            }

            var existedBefore = pathsBeforeDownload.Contains(full);
            var touchedThisRun = fi.LastWriteTimeUtc >= startedFloor;
            if (existedBefore && !touchedThisRun)
                continue;

            var ext = Path.GetExtension(full).ToLowerInvariant();
            list.Add(
                new JobArtifact
                {
                    Id = Guid.CreateVersion7(),
                    JobId = jobId,
                    Kind = MapKind(ext),
                    Path = full,
                    SizeBytes = fi.Length,
                    MimeType = GuessMime(ext)
                });
        }

        return list;
    }

    private static ArtifactKind MapKind(string ext) =>
        ext switch
        {
            ".mp4" or ".mkv" or ".webm" or ".mov" or ".avi" or ".m4v" => ArtifactKind.Video,
            ".m4a" or ".opus" or ".mp3" or ".aac" or ".flac" or ".wav" or ".ogg" => ArtifactKind.Audio,
            ".srt" or ".vtt" or ".ass" => ArtifactKind.Subtitle,
            ".jpg" or ".jpeg" or ".png" or ".webp" => ArtifactKind.Thumbnail,
            ".json" or ".info.json" or ".nfo" => ArtifactKind.Metadata,
            _ when ext.Contains("info", StringComparison.OrdinalIgnoreCase) => ArtifactKind.Metadata,
            _ => ArtifactKind.Video
        };

    private static string? GuessMime(string ext) =>
        ext switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mkv" => "video/x-matroska",
            ".m4a" => "audio/mp4",
            ".mp3" => "audio/mpeg",
            ".srt" => "application/x-subrip",
            ".vtt" => "text/vtt",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => null
        };
}
