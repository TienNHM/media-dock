namespace MediaDock.Domain.Schedules;

public sealed class Schedule
{
    public Guid Id { get; set; }
    public string Cron { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string JobTemplateJson { get; set; } = "{}";
    public DateTimeOffset? NextRunAt { get; set; }
    public DateTimeOffset? LastRunAt { get; set; }
    public bool Enabled { get; set; } = true;
}
