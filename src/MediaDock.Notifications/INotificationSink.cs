namespace MediaDock.Notifications;

public interface INotificationSink
{
    Task PublishAsync(string title, string body, CancellationToken cancellationToken = default);
}
