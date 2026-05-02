namespace MediaDock.Domain.Notifications;

public sealed class InAppNotification
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "info";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}
