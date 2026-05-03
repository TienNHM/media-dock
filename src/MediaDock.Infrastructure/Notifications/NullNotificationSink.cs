namespace MediaDock.Notifications;

public sealed class NullNotificationSink : INotificationSink
{
    public Task PublishAsync(string title, string body, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
