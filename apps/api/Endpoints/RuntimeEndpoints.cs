using MediaDock.Acquisition;
using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.Options;

namespace MediaDock.Api.Endpoints;

public static class RuntimeEndpoints
{
    public static IEndpointRouteBuilder MapRuntimeEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/runtime").WithTags("Runtime");

        g.MapGet(
                "/downloads",
                (IDownloadsPathResolver paths, IOptions<AcquisitionOptions> options) =>
                    Results.Ok(
                        new DownloadsInfoResponse(
                            paths.GetDownloadsRoot(),
                            options.Value.DownloadsRootPath)))
            .WithName("GetDownloadsInfo");

        return app;
    }
}

public sealed record DownloadsInfoResponse(string DownloadsRoot, string? ConfiguredRootPath);
