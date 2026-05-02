using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.DependencyInjection;

namespace MediaDock.Acquisition;

public static class DependencyInjection
{
    public static IServiceCollection AddAcquisition(this IServiceCollection services)
    {
        services.AddSingleton<IDownloadsPathResolver, DownloadsPathResolver>();
        services.AddSingleton<YtDlpBinaryResolver>();
        services.AddSingleton<FfmpegBinaryResolver>();
        services.AddSingleton<IMediaProbe, YtDlpMediaProbe>();
        services.AddSingleton<IMediaDownloader, YtDlpMediaDownloader>();
        services.AddSingleton<IMediaTranscoder, FfmpegMediaTranscoder>();
        return services;
    }
}
