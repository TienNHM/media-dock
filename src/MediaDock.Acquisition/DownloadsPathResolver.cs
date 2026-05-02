using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.Options;

namespace MediaDock.Acquisition;

public sealed class DownloadsPathResolver(IOptions<AcquisitionOptions> options) : IDownloadsPathResolver
{
    public string GetDownloadsRoot() => DownloadsPathHelper.ResolveDownloadsRoot(options.Value);

    public string GetJobDownloadDirectory(Guid jobId) =>
        DownloadsPathHelper.ResolveJobDownloadDirectory(options.Value, jobId);
}
