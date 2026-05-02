using MediatR;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.Library;

public sealed class ListLibraryQueryHandler(IJobRepository jobs) : IRequestHandler<ListLibraryQuery, IReadOnlyList<LibraryItemDto>>
{
    public async Task<IReadOnlyList<LibraryItemDto>> Handle(ListLibraryQuery request, CancellationToken cancellationToken)
    {
        var list = await jobs.ListRecentCompletedWithArtifactsAsync(request.Take, cancellationToken);
        return list
            .Where(j => j.Status == JobStatus.Completed && j.CompletedAt is not null)
            .Select(j => new LibraryItemDto(
                j.Id,
                j.Url,
                j.SourcePlatform,
                j.CompletedAt!.Value,
                j.Artifacts
                    .OrderByDescending(a => a.SizeBytes)
                    .Select(a => new LibraryArtifactDto(a.Id, a.Kind.ToString(), a.Path, a.SizeBytes))
                    .ToList()))
            .ToList();
    }
}
