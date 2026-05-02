using MediaDock.Acquisition;
using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Settings;
using Microsoft.Extensions.Options;

namespace MediaDock.Infrastructure.Downloads;

public sealed class DownloadsPathResolver(IOptions<AcquisitionOptions> options, IDownloadsRootStore rootStore)
    : IDownloadsPathResolver
{
    public async Task<string> GetDownloadsRootAsync(CancellationToken cancellationToken = default)
    {
        var persisted = await rootStore.GetPersistedRootAsync(cancellationToken);
        return DownloadsPathHelper.ResolveDownloadsRoot(options.Value, persisted);
    }

    public async Task<string> GetJobDownloadDirectoryAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var persisted = await rootStore.GetPersistedRootAsync(cancellationToken);
        return DownloadsPathHelper.ResolveJobDownloadDirectory(options.Value, jobId, persisted);
    }
}
