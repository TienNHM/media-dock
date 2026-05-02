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

        g.MapGet(
                "/{jobId:guid}/artifacts/{artifactId:guid}/preview",
                async (Guid jobId, Guid artifactId, IMediator m, CancellationToken ct) =>
                {
                    var preview = await m.Send(new GetLibraryArtifactPreviewQuery(jobId, artifactId), ct);
                    return preview is null
                        ? Results.NotFound()
                        : Results.File(
                            preview.FullPath,
                            preview.ContentType,
                            fileDownloadName: null,
                            enableRangeProcessing: true);
                })
            .WithName("LibraryArtifactPreview");

        return app;
    }
}
