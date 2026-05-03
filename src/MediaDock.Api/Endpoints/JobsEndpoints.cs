using MediaDock.Application.Jobs.Batch;
using MediaDock.Application.Jobs.CancelJob;
using MediaDock.Application.Jobs.CreateJob;
using MediaDock.Application.Jobs.GetJob;
using MediaDock.Application.Jobs.ListJobs;
using MediaDock.Application.Jobs.RetryJob;
using MediaDock.Domain.Jobs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MediaDock.Api.Endpoints;

public static class JobsEndpoints
{
    public static IEndpointRouteBuilder MapJobsEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/jobs").WithTags("Jobs");

        g.MapPost(
                "/",
                async ([FromBody] CreateJobRequest body, IMediator mediator, CancellationToken ct) =>
                {
                    var id = await mediator.Send(new CreateJobCommand(body.Url, body.Priority, body.PresetId), ct);
                    return Results.Created($"/api/jobs/{id}", new { id });
                })
            .WithName("CreateJob");

        g.MapPost(
                "/batch",
                async ([FromBody] CreateBatchJobsRequest body, IMediator mediator, CancellationToken ct) =>
                {
                    var ids = await mediator.Send(
                        new CreateBatchJobsCommand(body.Urls, body.Priority, body.PresetId),
                        ct);
                    return Results.Ok(new { ids });
                })
            .WithName("CreateBatchJobs");

        g.MapGet(
                "/",
                async ([FromQuery] int? take, [FromQuery] string? status, IMediator mediator, CancellationToken ct) =>
                {
                    JobStatus? st = null;
                    if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<JobStatus>(status, true, out var parsed))
                        st = parsed;
                    var list = await mediator.Send(new ListJobsQuery(take ?? 100, st), ct);
                    return Results.Ok(list);
                })
            .WithName("ListJobs");

        g.MapGet(
                "/{id:guid}",
                async (Guid id, IMediator mediator, CancellationToken ct) =>
                {
                    var job = await mediator.Send(new GetJobQuery(id), ct);
                    return job is null ? Results.NotFound() : Results.Ok(job);
                })
            .WithName("GetJob");

        g.MapPost(
                "/{id:guid}/cancel",
                async (Guid id, IMediator mediator, CancellationToken ct) =>
                {
                    var ok = await mediator.Send(new CancelJobCommand(id), ct);
                    return ok ? Results.NoContent() : Results.NotFound();
                })
            .WithName("CancelJob");

        g.MapPost(
                "/{id:guid}/retry",
                async (Guid id, IMediator mediator, CancellationToken ct) =>
                {
                    var newId = await mediator.Send(new RetryJobCommand(id), ct);
                    return newId is null
                        ? Results.NotFound()
                        : Results.Created($"/api/jobs/{newId}", new { id = newId });
                })
            .WithName("RetryJob");

        return app;
    }
}

public sealed record CreateJobRequest(string Url, int Priority = 0, Guid? PresetId = null);

public sealed record CreateBatchJobsRequest(IReadOnlyList<string> Urls, int Priority = 0, Guid? PresetId = null);
