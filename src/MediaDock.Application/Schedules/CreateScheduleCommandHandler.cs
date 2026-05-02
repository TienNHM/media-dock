using Cronos;
using MediaDock.Application.Ports.Schedules;
using MediaDock.Domain.Schedules;
using MediatR;

namespace MediaDock.Application.Schedules;

public sealed class CreateScheduleCommandHandler(IScheduleRepository schedules) : IRequestHandler<CreateScheduleCommand, Guid>
{
    public async Task<Guid> Handle(CreateScheduleCommand request, CancellationToken cancellationToken)
    {
        var template = ScheduleJobTemplateJson.Parse(request.JobTemplateJson);
        if (string.IsNullOrWhiteSpace(template.Url))
            throw new InvalidOperationException("Job template must include a non-empty url.");

        var tz = ResolveTimeZone(request.Timezone);
        var cron = CronExpression.Parse(request.Cron.Trim(), CronFormat.Standard);
        var now = DateTime.UtcNow;
        var next = cron.GetNextOccurrence(now, tz) ?? now.AddMinutes(1);

        var id = Guid.CreateVersion7();
        await schedules.AddAsync(
            new Schedule
            {
                Id = id,
                Cron = request.Cron.Trim(),
                Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "UTC" : request.Timezone.Trim(),
                JobTemplateJson = request.JobTemplateJson.Trim(),
                Enabled = request.Enabled,
                NextRunAt = next,
                LastRunAt = null
            },
            cancellationToken);
        await schedules.SaveChangesAsync(cancellationToken);
        return id;
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
