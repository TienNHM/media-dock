namespace MediaDock.Application.Ports.Acquisition;

/// <summary>
/// Resolves the configurable downloads directory; files are written directly under that root.
/// </summary>
public interface IDownloadsPathResolver
{
    Task<string> GetDownloadsRootAsync(CancellationToken cancellationToken = default);

    Task<string> GetJobDownloadDirectoryAsync(Guid jobId, CancellationToken cancellationToken = default);
}
