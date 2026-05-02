using MediatR;

namespace MediaDock.Application.Notifications;

public sealed record ListNotificationsQuery(int Take = 50) : IRequest<IReadOnlyList<NotificationDto>>;

public sealed record NotificationDto(
    Guid Id,
    Guid? JobId,
    string Type,
    string Title,
    string Body,
    DateTime CreatedAt,
    DateTime? ReadAt);
