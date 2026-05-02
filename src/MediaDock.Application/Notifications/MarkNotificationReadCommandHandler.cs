using MediatR;
using MediaDock.Application.Ports.Notifications;

namespace MediaDock.Application.Notifications;

public sealed class MarkNotificationReadCommandHandler(IInAppNotificationRepository notifications)
    : IRequestHandler<MarkNotificationReadCommand, bool>
{
    public Task<bool> Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken) =>
        notifications.MarkReadAsync(request.Id, cancellationToken);
}
