using MediatR;
using MediaDock.Application.Ports.Jobs;

namespace MediaDock.Application.Jobs.ListJobs;

public sealed class ListJobsQueryHandler(IJobRepository jobs)
    : IRequestHandler<ListJobsQuery, IReadOnlyList<JobSummaryDto>>
{
    public async Task<IReadOnlyList<JobSummaryDto>> Handle(ListJobsQuery request, CancellationToken cancellationToken)
    {
        var list = await jobs.ListAsync(request.Take, request.Status, cancellationToken);
        return list
            .Select(j => new JobSummaryDto(
                j.Id,
                j.Url,
                j.SourcePlatform,
                j.Status,
                j.Priority,
                j.CreatedAt,
                j.LastErrorMessage))
            .ToList();
    }
}
