using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Application.Ports.Progress;
using MediaDock.Domain.Jobs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace MediaDock.Application.Jobs.ProcessJob;

public sealed class ProcessDownloadJobCommandHandler(
    IJobRepository jobs,
    IMediaProbe probe,
    IMediaDownloader downloader,
    IJobProgressPublisher progress,
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
            var probeResult = await probe.ProbeAsync(job.Url, cancellationToken);
            await progress.PublishAsync(
                new JobProgressDto(job.Id, "probed", null, null, null, DateTime.UtcNow),
                cancellationToken);

            if (!await jobs.TryTransitionAsync(job.Id, JobStatus.Probing, JobStatus.Downloading, null, cancellationToken))
                return;
            await jobs.SaveChangesAsync(cancellationToken);

            var workDir = Path.Combine(Path.GetTempPath(), "mediadock", job.Id.ToString("N"));
            Directory.CreateDirectory(workDir);

            var spec = new DownloadSpec(
                job.Id,
                job.Url,
                workDir,
                FormatSelector: "bv*+ba/b",
                ProxyUrl: null,
                CookiesFilePath: null,
                WriteSubtitles: false,
                WriteThumbnail: false);

            await foreach (var ev in downloader.DownloadAsync(spec, cancellationToken))
            {
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

            if (!await jobs.TryTransitionAsync(job.Id, JobStatus.Downloading, JobStatus.Completed, null, cancellationToken))
                return;

            job.CompletedAt = DateTime.UtcNow;
            await jobs.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            await jobs.ForceStatusAsync(job.Id, JobStatus.Paused, "cancelled", null, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job {JobId} failed", job.Id);
            await jobs.ForceStatusAsync(job.Id, JobStatus.Failed, ex.Message, ex.GetType().Name, cancellationToken);
        }
    }
}
