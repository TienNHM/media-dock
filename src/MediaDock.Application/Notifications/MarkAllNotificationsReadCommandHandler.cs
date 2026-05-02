using MediatR;
using MediaDock.Application.Ports.Notifications;

namespace MediaDock.Application.Notifications;

public sealed class MarkAllNotificationsReadCommandHandler(IInAppNotificationRepository notifications)
    : IRequestHandler<MarkAllNotificationsReadCommand, Unit>
{
    public async Task<Unit> Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        await notifications.MarkAllReadAsync(cancellationToken);
        return Unit.Value;
    }
}
