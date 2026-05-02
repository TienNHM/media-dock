namespace MediaDock.Domain.Schedules;

/// <summary>
/// Run instants are persisted as UTC.
/// </summary>
public sealed class Schedule
{
    public Guid Id { get; set; }
    public string Cron { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string JobTemplateJson { get; set; } = "{}";
    public DateTime? NextRunAt { get; set; }
    public DateTime? LastRunAt { get; set; }
    public bool Enabled { get; set; } = true;
}
