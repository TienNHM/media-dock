using Cronos;
using MediaDock.Application.Jobs.CreateJob;
using MediaDock.Application.Ports.Schedules;
using MediaDock.Application.Schedules;
using MediaDock.Domain.Schedules;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MediaDock.Infrastructure.Schedules;

/// <summary>Evaluates cron schedules and enqueues acquisition jobs from JSON templates.</summary>
public sealed class ScheduleDispatchHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<ScheduleDispatchHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var schedules = scope.ServiceProvider.GetRequiredService<IScheduleRepository>();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                var list = await schedules.ListAsync(stoppingToken);
                var now = DateTime.UtcNow;

                foreach (var s in list.Where(x => x.Enabled))
                {
                    if (s.NextRunAt is null || s.NextRunAt > now)
                        continue;

                    var template = ScheduleJobTemplateJson.Parse(s.JobTemplateJson);
                    if (string.IsNullOrWhiteSpace(template.Url))
                    {
                        logger.LogWarning("Schedule {ScheduleId} skipped: empty url in template", s.Id);
                        AdvanceNext(s, now);
                        await schedules.SaveChangesAsync(stoppingToken);
                        continue;
                    }

                    try
                    {
                        await mediator.Send(
                            new CreateJobCommand(template.Url, template.Priority, template.PresetId),
                            stoppingToken);
                        logger.LogInformation("Schedule {ScheduleId} enqueued job for {Url}", s.Id, template.Url);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Schedule {ScheduleId} failed to create job", s.Id);
                    }

                    s.LastRunAt = now;
                    AdvanceNext(s, now);
                    await schedules.SaveChangesAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Schedule dispatch loop error");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private static void AdvanceNext(Schedule s, DateTime nowUtc)
    {
        try
        {
            var tz = ResolveTimeZone(s.Timezone);
            var cron = CronExpression.Parse(s.Cron, CronFormat.Standard);
            s.NextRunAt = cron.GetNextOccurrence(nowUtc, tz) ?? nowUtc.AddMinutes(1);
        }
        catch
        {
            s.NextRunAt = nowUtc.AddMinutes(5);
        }
    }

    private static TimeZoneInfo ResolveTimeZone(string? id)
    {
        if (string.IsNullOrWhiteSpace(id) || id.Equals("UTC", StringComparison.OrdinalIgnoreCase))
            return TimeZoneInfo.Utc;
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id.Trim());
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }
}
