using MediaDock.Acquisition;
using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MediaDock.Api.Endpoints;

public static class RuntimeEndpoints
{
    public static IEndpointRouteBuilder MapRuntimeEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/runtime").WithTags("Runtime");

        g.MapGet(
                "/downloads",
                async (IDownloadsPathResolver paths, IOptions<AcquisitionOptions> options, IDownloadsRootStore store, CancellationToken ct) =>
                {
                    var root = await paths.GetDownloadsRootAsync(ct);
                    var cfg = options.Value.DownloadsRootPath;
                    var db = await store.GetPersistedRootAsync(ct);
                    var source = !string.IsNullOrWhiteSpace(cfg) ? "config" : db != null ? "database" : "default";
                    return Results.Ok(new DownloadsInfoResponse(root, cfg, db, source));
                })
            .WithName("GetDownloadsInfo");

        g.MapPut(
                "/downloads",
                async ([FromBody] SetDownloadsPathRequest body, IDownloadsRootStore store, CancellationToken ct) =>
                {
                    await store.SetPersistedRootAsync(
                        string.IsNullOrWhiteSpace(body.Path) ? null : body.Path.Trim(),
                        ct);
                    return Results.NoContent();
                })
            .WithName("SetDownloadsPath");

        return app;
    }
}

public sealed record DownloadsInfoResponse(
    string DownloadsRoot,
    string? ConfiguredRootPath,
    string? DatabaseRootPath,
    string Source);

public sealed record SetDownloadsPathRequest(string? Path);
