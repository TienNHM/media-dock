using MediaDock.Application.Ports.Jobs;
using MediaDock.Application.Ports.Queue;
using MediaDock.Domain.Jobs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MediaDock.Queue;

/// <summary>
/// Rehydrates SQLite-backed queued jobs into the in-process channel after restart.
/// </summary>
public sealed class QueueRecoveryHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<QueueRecoveryHostedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var jobs = scope.ServiceProvider.GetRequiredService<IJobRepository>();
        var queue = scope.ServiceProvider.GetRequiredService<IDownloadQueue>();

        var queued = await jobs.ListAsync(2000, JobStatus.Queued, cancellationToken);
        foreach (var j in queued)
        {
            await queue.EnqueueAsync(new JobEnvelope(j.Id, j.Attempt, j.CorrelationId), cancellationToken);
        }

        logger.LogInformation("Rehydrated {Count} queued jobs into channel", queued.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
