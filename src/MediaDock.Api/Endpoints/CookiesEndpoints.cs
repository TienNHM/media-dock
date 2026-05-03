using MediaDock.Application.Ports.Settings;
using MediaDock.Application.Settings;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MediaDock.Api.Endpoints;

public static class CookiesEndpoints
{
    public static IEndpointRouteBuilder MapCookiesEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/cookies").WithTags("Cookies");

        g.MapGet(
                "/profiles",
                async (IMediator m, CancellationToken ct) =>
                    Results.Ok(await m.Send(new GetCookieProfilesQuery(), ct)))
            .WithName("GetCookieProfiles");

        g.MapPut(
                "/profiles",
                async ([FromBody] IReadOnlyList<CookieProfileRequest> body, IMediator m, CancellationToken ct) =>
                {
                    var now = DateTime.UtcNow;
                    var list = body
                        .Where(x => !string.IsNullOrWhiteSpace(x.Name) && !string.IsNullOrWhiteSpace(x.FilePath))
                        .Select(
                            x => new CookieProfileDto(
                                x.Id ?? Guid.CreateVersion7(),
                                x.Name.Trim(),
                                x.FilePath.Trim(),
                                x.CreatedAt ?? now))
                        .ToList();
                    await m.Send(new SaveCookieProfilesCommand(list), ct);
                    return Results.NoContent();
                })
            .WithName("SaveCookieProfiles");

        return app;
    }
}

public sealed record CookieProfileRequest(Guid? Id, string Name, string FilePath, DateTime? CreatedAt);
