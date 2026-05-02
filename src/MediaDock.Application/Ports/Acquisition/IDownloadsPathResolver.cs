namespace MediaDock.Application.Ports.Acquisition;

/// <summary>
/// Resolves where completed downloads are stored (per-job subfolders under a configurable root).
/// </summary>
public interface IDownloadsPathResolver
{
    Task<string> GetDownloadsRootAsync(CancellationToken cancellationToken = default);

    Task<string> GetJobDownloadDirectoryAsync(Guid jobId, CancellationToken cancellationToken = default);
}
