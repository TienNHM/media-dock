using MediatR;
using MediaDock.Application.Ports.Notifications;

namespace MediaDock.Application.Notifications;

public sealed class ListNotificationsQueryHandler(IInAppNotificationRepository notifications)
    : IRequestHandler<ListNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    public async Task<IReadOnlyList<NotificationDto>> Handle(ListNotificationsQuery request, CancellationToken cancellationToken)
    {
        var list = await notifications.ListAsync(request.Take, cancellationToken);
        return list
            .Select(n => new NotificationDto(n.Id, n.JobId, n.Type, n.Title, n.Body, n.CreatedAt, n.ReadAt))
            .ToList();
    }
}
