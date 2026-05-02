using MediaDock.Application.Ports.Library;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.Library;

internal static class LibraryArtifactDeletionPaths
{
    internal static List<string> CollectUniquePathsStrictlyUnderRoot(
        string downloadsRootFullPath,
        IEnumerable<JobArtifact> artifacts)
    {
        var rootDir = downloadsRootFullPath;

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var paths = new List<string>();

        foreach (var artifact in artifacts)
        {
            var candidate = Path.GetFullPath(artifact.Path);
            if (!ArtifactStoragePathSafety.IsStrictChildOfRoot(rootDir, candidate))
                continue;
            if (!seen.Add(candidate))
                continue;
            paths.Add(candidate);
        }

        return paths;
    }
}
