using MediaDock.Application.Presets;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MediaDock.Api.Endpoints;

public static class PresetsEndpoints
{
    public static IEndpointRouteBuilder MapPresetsEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/presets").WithTags("Presets");

        g.MapGet("/", async (IMediator m, CancellationToken ct) => Results.Ok(await m.Send(new ListPresetsQuery(), ct)))
            .WithName("ListPresets");

        g.MapPost(
                "/",
                async ([FromBody] CreatePresetRequest body, IMediator m, CancellationToken ct) =>
                {
                    var id = await m.Send(
                        new CreatePresetCommand(body.Name, body.Description, body.SpecJson, body.IsDefault),
                        ct);
                    return Results.Created($"/api/presets/{id}", new { id });
                })
            .WithName("CreatePreset");

        g.MapPut(
                "/{id:guid}",
                async (Guid id, [FromBody] UpdatePresetRequest body, IMediator m, CancellationToken ct) =>
                {
                    var ok = await m.Send(
                        new UpdatePresetCommand(id, body.Name, body.Description, body.SpecJson, body.IsDefault),
                        ct);
                    return ok ? Results.NoContent() : Results.NotFound();
                })
            .WithName("UpdatePreset");

        g.MapDelete(
                "/{id:guid}",
                async (Guid id, IMediator m, CancellationToken ct) =>
                {
                    var ok = await m.Send(new DeletePresetCommand(id), ct);
                    return ok ? Results.NoContent() : Results.NotFound();
                })
            .WithName("DeletePreset");

        return app;
    }
}

public sealed record CreatePresetRequest(string Name, string? Description, string SpecJson, bool IsDefault = false);

public sealed record UpdatePresetRequest(string Name, string? Description, string SpecJson, bool IsDefault);
