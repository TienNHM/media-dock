using MediaDock.Application.Notifications;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MediaDock.Api.Endpoints;

public static class NotificationsEndpoints
{
    public static IEndpointRouteBuilder MapNotificationsEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/notifications").WithTags("Notifications");

        g.MapGet(
                "/",
                async ([FromQuery] int? take, IMediator m, CancellationToken ct) =>
                    Results.Ok(await m.Send(new ListNotificationsQuery(take ?? 50), ct)))
            .WithName("ListNotifications");

        g.MapGet(
                "/unread-count",
                async (IMediator m, CancellationToken ct) =>
                    Results.Ok(new { count = await m.Send(new UnreadNotificationCountQuery(), ct) }))
            .WithName("UnreadNotificationCount");

        g.MapPost(
                "/{id:guid}/read",
                async (Guid id, IMediator m, CancellationToken ct) =>
                {
                    var ok = await m.Send(new MarkNotificationReadCommand(id), ct);
                    return ok ? Results.NoContent() : Results.NotFound();
                })
            .WithName("MarkNotificationRead");

        g.MapPost(
                "/read-all",
                async (IMediator m, CancellationToken ct) =>
                {
                    await m.Send(new MarkAllNotificationsReadCommand(), ct);
                    return Results.NoContent();
                })
            .WithName("MarkAllNotificationsRead");

        return app;
    }
}
