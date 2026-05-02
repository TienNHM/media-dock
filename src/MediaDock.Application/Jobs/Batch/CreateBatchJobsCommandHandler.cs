using MediaDock.Application.Jobs.CreateJob;
using MediatR;

namespace MediaDock.Application.Jobs.Batch;

public sealed class CreateBatchJobsCommandHandler(IMediator mediator) : IRequestHandler<CreateBatchJobsCommand, IReadOnlyList<Guid>>
{
    public async Task<IReadOnlyList<Guid>> Handle(CreateBatchJobsCommand request, CancellationToken cancellationToken)
    {
        var ids = new List<Guid>();
        foreach (var raw in request.Urls)
        {
            var u = raw?.Trim();
            if (string.IsNullOrEmpty(u))
                continue;
            ids.Add(await mediator.Send(new CreateJobCommand(u, request.Priority, request.PresetId), cancellationToken));
        }

        return ids;
    }
}
