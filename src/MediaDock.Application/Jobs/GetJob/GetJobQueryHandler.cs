using MediatR;
using MediaDock.Application.Ports.Jobs;

namespace MediaDock.Application.Jobs.GetJob;

public sealed class GetJobQueryHandler(IJobRepository jobs) : IRequestHandler<GetJobQuery, JobDetailDto?>
{
    public async Task<JobDetailDto?> Handle(GetJobQuery request, CancellationToken cancellationToken)
    {
        var job = await jobs.GetByIdAsync(request.JobId, cancellationToken);
        if (job is null)
            return null;

        var specJson = job.CurrentSpec?.SpecJson ?? JobSpecJson.DefaultJson();
        var progress = job.Progress is null
            ? null
            : new JobProgressSnapshotDto(
                job.Progress.Phase,
                null,
                job.Progress.BytesDone,
                job.Progress.BytesTotal,
                job.Progress.UpdatedAt);

        var artifacts = job.Artifacts
            .OrderBy(a => a.Kind)
            .ThenBy(a => a.Path)
            .Select(a => new JobArtifactDto(a.Id, a.Kind, a.Path, a.SizeBytes, a.MimeType))
            .ToList();

        return new JobDetailDto(
            job.Id,
            job.Url,
            job.SourcePlatform,
            job.Status,
            job.Priority,
            job.PresetId,
            job.CreatedAt,
            job.StartedAt,
            job.CompletedAt,
            job.LastErrorMessage,
            specJson,
            progress,
            artifacts);
    }
}
