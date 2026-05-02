namespace MediaDock.Application.Ports.Library;

/// <summary>
/// Best-effort deletion of on-disk files that were recorded as library artifacts.
/// Implementations must refuse paths that escape the downloads root.
/// </summary>
public interface ILibraryStoredFileRemoval
{
    void TryDeleteFileUnderDownloadsRoot(string downloadsRootFullPath, string artifactFileFullPath);
}
