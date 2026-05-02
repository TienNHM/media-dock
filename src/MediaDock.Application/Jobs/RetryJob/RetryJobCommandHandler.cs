using MediaDock.Application.Jobs.CreateJob;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Domain.Jobs;
using MediatR;

namespace MediaDock.Application.Jobs.RetryJob;

public sealed class RetryJobCommandHandler(IJobRepository jobs, IMediator mediator) : IRequestHandler<RetryJobCommand, Guid?>
{
    public async Task<Guid?> Handle(RetryJobCommand request, CancellationToken cancellationToken)
    {
        var job = await jobs.GetByIdAsync(request.JobId, cancellationToken);
        if (job is null)
            return null;

        if (job.Status is not (JobStatus.Failed or JobStatus.FailedPermanent or JobStatus.Cancelled or JobStatus.Completed))
            return null;

        var root = job.LineageRootId ?? job.Id;
        return await mediator.Send(
            new CreateJobCommand(job.Url, job.Priority, job.PresetId, job.Id, root),
            cancellationToken);
    }
}
