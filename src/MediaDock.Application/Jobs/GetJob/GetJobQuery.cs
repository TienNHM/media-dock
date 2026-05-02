using MediatR;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.GetJob;

public sealed record GetJobQuery(Guid JobId) : IRequest<JobDetailDto?>;

public sealed record JobArtifactDto(Guid Id, ArtifactKind Kind, string Path, long? SizeBytes, string? MimeType);

public sealed record JobProgressSnapshotDto(
    string Phase,
    double? Percent,
    long? BytesDone,
    long? BytesTotal,
    DateTime UpdatedAt);

public sealed record JobDetailDto(
    Guid Id,
    string Url,
    string SourcePlatform,
    JobStatus Status,
    int Priority,
    Guid? PresetId,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? LastErrorMessage,
    string SpecJson,
    JobProgressSnapshotDto? Progress,
    IReadOnlyList<JobArtifactDto> Artifacts);
