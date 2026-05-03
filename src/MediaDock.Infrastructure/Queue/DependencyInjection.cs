using MediaDock.Application.Ports.Queue;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MediaDock.Queue;

public static class DependencyInjection
{
    public static IServiceCollection AddQueueInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IDownloadQueue, DownloadQueue>();
        services.AddHostedService<QueueRecoveryHostedService>();
        services.AddHostedService<JobRunnerHostedService>();
        return services;
    }
}
