using MediatR;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.ListJobs;

public sealed record ListJobsQuery(int Take = 100, JobStatus? Status = null)
    : IRequest<IReadOnlyList<JobSummaryDto>>;

public sealed record JobSummaryDto(
    Guid Id,
    string Url,
    string SourcePlatform,
    JobStatus Status,
    int Priority,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? LastErrorMessage);
