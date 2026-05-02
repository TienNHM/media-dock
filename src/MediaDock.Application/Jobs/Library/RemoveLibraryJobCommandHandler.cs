using MediatR;
using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Application.Ports.Library;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.Library;

public sealed class RemoveLibraryJobCommandHandler(
    IJobRepository jobs,
    IDownloadsPathResolver downloadPaths,
    ILibraryStoredFileRemoval fileRemoval)
    : IRequestHandler<RemoveLibraryJobCommand, bool>
{
    public async Task<bool> Handle(RemoveLibraryJobCommand request, CancellationToken cancellationToken)
    {
        var job = await jobs.GetByIdAsync(request.JobId, cancellationToken);
        if (job is null || job.Status != JobStatus.Completed)
            return false;

        var root = Path.GetFullPath(await downloadPaths.GetDownloadsRootAsync(cancellationToken));
        var toDelete = LibraryArtifactDeletionPaths.CollectUniquePathsStrictlyUnderRoot(root, job.Artifacts);

        jobs.Remove(job);
        await jobs.SaveChangesAsync(cancellationToken);

        foreach (var path in toDelete)
            fileRemoval.TryDeleteFileUnderDownloadsRoot(root, path);

        return true;
    }
}
