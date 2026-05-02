using Cronos;
using MediaDock.Application.Ports.Schedules;
using MediatR;

namespace MediaDock.Application.Schedules;

public sealed class UpdateScheduleCommandHandler(IScheduleRepository schedules) : IRequestHandler<UpdateScheduleCommand, bool>
{
    public async Task<bool> Handle(UpdateScheduleCommand request, CancellationToken cancellationToken)
    {
        var s = await schedules.GetByIdAsync(request.Id, cancellationToken);
        if (s is null)
            return false;

        var cron = CronExpression.Parse(request.Cron.Trim(), CronFormat.Standard);
        var template = ScheduleJobTemplateJson.Parse(request.JobTemplateJson);
        if (string.IsNullOrWhiteSpace(template.Url))
            throw new InvalidOperationException("Job template must include a non-empty url.");

        var tz = ResolveTimeZone(request.Timezone);
        s.Cron = request.Cron.Trim();
        s.Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "UTC" : request.Timezone.Trim();
        s.JobTemplateJson = request.JobTemplateJson.Trim();
        s.Enabled = request.Enabled;
        var now = DateTime.UtcNow;
        s.NextRunAt = cron.GetNextOccurrence(now, tz) ?? now.AddMinutes(1);
        await schedules.SaveChangesAsync(cancellationToken);
        return true;
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
