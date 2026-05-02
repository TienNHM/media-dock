using MediaDock.Domain.Notifications;

namespace MediaDock.Application.Ports.Notifications;

public interface IInAppNotificationRepository
{
    Task AddAsync(InAppNotification notification, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InAppNotification>> ListAsync(int take, CancellationToken cancellationToken = default);

    Task<int> CountUnreadAsync(CancellationToken cancellationToken = default);

    Task<bool> MarkReadAsync(Guid id, CancellationToken cancellationToken = default);

    Task MarkAllReadAsync(CancellationToken cancellationToken = default);
}
