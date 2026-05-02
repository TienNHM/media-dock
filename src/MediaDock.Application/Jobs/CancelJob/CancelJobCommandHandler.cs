using MediaDock.Application.Ports.Jobs;
using MediaDock.Domain.Jobs;
using MediatR;

namespace MediaDock.Application.Jobs.CancelJob;

public sealed class CancelJobCommandHandler(IJobRepository jobs) : IRequestHandler<CancelJobCommand, bool>
{
    public async Task<bool> Handle(CancelJobCommand request, CancellationToken cancellationToken)
    {
        var job = await jobs.GetByIdAsync(request.JobId, cancellationToken);
        if (job is null)
            return false;

        if (job.Status is JobStatus.Completed or JobStatus.Cancelled or JobStatus.FailedPermanent or JobStatus.Failed)
            return false;

        await jobs.ForceStatusAsync(request.JobId, JobStatus.Cancelled, "cancelled by user", null, cancellationToken);
        return true;
    }
}
