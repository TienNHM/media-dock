using MediatR;

namespace MediaDock.Application.Notifications;

public sealed record MarkAllNotificationsReadCommand : IRequest<Unit>;
