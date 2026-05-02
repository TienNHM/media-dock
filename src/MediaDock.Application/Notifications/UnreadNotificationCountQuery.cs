using MediatR;

namespace MediaDock.Application.Notifications;

public sealed record UnreadNotificationCountQuery : IRequest<int>;
