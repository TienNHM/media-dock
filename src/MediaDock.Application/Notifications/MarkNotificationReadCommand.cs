using MediatR;

namespace MediaDock.Application.Notifications;

public sealed record MarkNotificationReadCommand(Guid Id) : IRequest<bool>;
