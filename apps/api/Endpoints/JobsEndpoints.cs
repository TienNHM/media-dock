using MediaDock.Application.Jobs.CreateJob;
using MediaDock.Application.Jobs.ListJobs;
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

        return app;
    }
}

public sealed record CreateJobRequest(string Url, int Priority = 0, Guid? PresetId = null);
