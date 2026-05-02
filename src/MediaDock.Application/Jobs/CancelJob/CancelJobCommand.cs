using MediatR;

namespace MediaDock.Application.Jobs.CancelJob;

public sealed record CancelJobCommand(Guid JobId) : IRequest<bool>;
