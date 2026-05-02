using MediaDock.Application.Ports.Library;
using Microsoft.Extensions.Logging;

namespace MediaDock.Infrastructure.Library;

public sealed class PhysicalLibraryStoredFileRemoval(ILogger<PhysicalLibraryStoredFileRemoval> logger) : ILibraryStoredFileRemoval
{
    public void TryDeleteFileUnderDownloadsRoot(string downloadsRootFullPath, string artifactFileFullPath)
    {
        var root = Path.GetFullPath(downloadsRootFullPath);
        var file = Path.GetFullPath(artifactFileFullPath);

        if (!ArtifactStoragePathSafety.IsStrictChildOfRoot(root, file))
        {
            logger.LogWarning(
                "Skipped library file delete — path outside downloads root. File={Path}",
                artifactFileFullPath);
            return;
        }

        try
        {
            if (!File.Exists(file))
                return;
            File.Delete(file);
        }
        catch (IOException ex)
        {
            logger.LogWarning(ex, "Could not delete library artifact file: {Path}", file);
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning(ex, "Access denied deleting library artifact file: {Path}", file);
        }
    }
}
