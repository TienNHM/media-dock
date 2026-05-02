using MediaDock.Application.Ports.Jobs;
using MediaDock.Application.Ports.Queue;
using MediaDock.Domain.Jobs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace MediaDock.Application.Jobs.CreateJob;

public sealed class CreateJobCommandHandler(
    IJobRepository jobs,
    IDownloadQueue queue,
    ILogger<CreateJobCommandHandler> logger) : IRequestHandler<CreateJobCommand, Guid>
{
    public async Task<Guid> Handle(CreateJobCommand request, CancellationToken cancellationToken)
    {
        var id = Guid.CreateVersion7();
        var correlationId = Guid.CreateVersion7().ToString("N");
        var platform = DetectPlatform(request.Url);

        var job = new Job
        {
            Id = id,
            Url = request.Url.Trim(),
            SourcePlatform = platform,
            Status = JobStatus.Pending,
            Priority = request.Priority,
            PresetId = request.PresetId,
            ScheduledAt = DateTimeOffset.UtcNow,
            Attempt = 1,
            CorrelationId = correlationId,
            CreatedAt = DateTimeOffset.UtcNow,
            LineageRootId = id,
            CurrentSpec = new JobSpec
            {
                Id = Guid.CreateVersion7(),
                JobId = id,
                Attempt = 1,
                SpecJson = """{"format":"best","subs":false,"thumb":false}"""
            }
        };

        await jobs.AddAsync(job, cancellationToken);
        await jobs.SaveChangesAsync(cancellationToken);

        await jobs.TryTransitionAsync(id, JobStatus.Pending, JobStatus.Queued, null, cancellationToken);
        await jobs.SaveChangesAsync(cancellationToken);

        await queue.EnqueueAsync(new JobEnvelope(id, job.Attempt, correlationId), cancellationToken);
        logger.LogInformation("Job {JobId} queued for {Url}", id, request.Url);
        return id;
    }

    private static string DetectPlatform(string url)
    {
        var u = url.ToLowerInvariant();
        if (u.Contains("youtube.com") || u.Contains("youtu.be")) return "youtube";
        if (u.Contains("tiktok.com")) return "tiktok";
        if (u.Contains("instagram.com")) return "instagram";
        if (u.Contains("twitter.com") || u.Contains("x.com")) return "twitter";
        if (u.Contains("facebook.com")) return "facebook";
        if (u.Contains("vimeo.com")) return "vimeo";
        if (u.Contains("reddit.com")) return "reddit";
        return "unknown";
    }
}
