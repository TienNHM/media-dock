using MediaDock.Application.Jobs.Library;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MediaDock.Api.Endpoints;

public static class LibraryEndpoints
{
    public static IEndpointRouteBuilder MapLibraryEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/library").WithTags("Library");

        g.MapGet(
                "/",
                async ([FromQuery] int? take, IMediator m, CancellationToken ct) =>
                    Results.Ok(await m.Send(new ListLibraryQuery(take ?? 100), ct)))
            .WithName("ListLibrary");

        return app;
    }
}
