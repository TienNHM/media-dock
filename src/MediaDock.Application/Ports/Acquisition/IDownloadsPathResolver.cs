namespace MediaDock.Application.Ports.Acquisition;

/// <summary>
/// Resolves where completed downloads are stored (per-job subfolders under a configurable root).
/// </summary>
public interface IDownloadsPathResolver
{
    string GetDownloadsRoot();

    string GetJobDownloadDirectory(Guid jobId);
}
