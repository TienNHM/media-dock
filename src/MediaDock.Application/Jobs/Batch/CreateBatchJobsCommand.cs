using MediatR;

namespace MediaDock.Application.Jobs.Batch;

public sealed record CreateBatchJobsCommand(IReadOnlyList<string> Urls, int Priority = 0, Guid? PresetId = null)
    : IRequest<IReadOnlyList<Guid>>;
