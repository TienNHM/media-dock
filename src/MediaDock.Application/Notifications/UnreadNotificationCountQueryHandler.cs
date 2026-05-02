using MediatR;
using MediaDock.Application.Ports.Notifications;

namespace MediaDock.Application.Notifications;

public sealed class UnreadNotificationCountQueryHandler(IInAppNotificationRepository notifications)
    : IRequestHandler<UnreadNotificationCountQuery, int>
{
    public Task<int> Handle(UnreadNotificationCountQuery request, CancellationToken cancellationToken) =>
        notifications.CountUnreadAsync(cancellationToken);
}
