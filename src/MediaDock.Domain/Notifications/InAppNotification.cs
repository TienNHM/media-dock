namespace MediaDock.Domain.Notifications;

/// <summary>
/// Timestamps are persisted as UTC.
/// </summary>
public sealed class InAppNotification
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "info";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
