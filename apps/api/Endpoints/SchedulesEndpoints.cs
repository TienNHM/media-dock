using MediaDock.Application.Schedules;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MediaDock.Api.Endpoints;

public static class SchedulesEndpoints
{
    public static IEndpointRouteBuilder MapSchedulesEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/schedules").WithTags("Schedules");

        g.MapGet("/", async (IMediator m, CancellationToken ct) => Results.Ok(await m.Send(new ListSchedulesQuery(), ct)))
            .WithName("ListSchedules");

        g.MapPost(
                "/",
                async ([FromBody] CreateScheduleRequest body, IMediator m, CancellationToken ct) =>
                {
                    try
                    {
                        var id = await m.Send(
                            new CreateScheduleCommand(body.Cron, body.Timezone, body.JobTemplateJson, body.Enabled),
                            ct);
                        return Results.Created($"/api/schedules/{id}", new { id });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("CreateSchedule");

        g.MapPut(
                "/{id:guid}",
                async (Guid id, [FromBody] UpdateScheduleRequest body, IMediator m, CancellationToken ct) =>
                {
                    try
                    {
                        var ok = await m.Send(
                            new UpdateScheduleCommand(id, body.Cron, body.Timezone, body.JobTemplateJson, body.Enabled),
                            ct);
                        return ok ? Results.NoContent() : Results.NotFound();
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new { error = ex.Message });
                    }
                })
            .WithName("UpdateSchedule");

        g.MapDelete(
                "/{id:guid}",
                async (Guid id, IMediator m, CancellationToken ct) =>
                {
                    var ok = await m.Send(new DeleteScheduleCommand(id), ct);
                    return ok ? Results.NoContent() : Results.NotFound();
                })
            .WithName("DeleteSchedule");

        return app;
    }
}

public sealed record CreateScheduleRequest(string Cron, string Timezone, string JobTemplateJson, bool Enabled = true);

public sealed record UpdateScheduleRequest(string Cron, string Timezone, string JobTemplateJson, bool Enabled);
