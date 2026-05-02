using MediaDock.Application.Jobs.ProcessJob;
using MediaDock.Application.Ports.Queue;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MediaDock.Queue;

/// <summary>
/// Consumes durable queue channel and dispatches MediatR commands (at-least-once; handler is idempotent by design).
/// </summary>
public sealed class JobRunnerHostedService(
    IDownloadQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<JobRunnerHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Job runner started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var envelope = await queue.DequeueAsync(stoppingToken);
                await using var scope = scopeFactory.CreateAsyncScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                await mediator.Send(
                    new ProcessDownloadJobCommand(envelope.JobId, envelope.Attempt, envelope.CorrelationId),
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Job runner loop error");
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }
}
