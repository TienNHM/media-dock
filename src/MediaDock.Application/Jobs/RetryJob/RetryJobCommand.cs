using MediatR;

namespace MediaDock.Application.Jobs.RetryJob;

public sealed record RetryJobCommand(Guid JobId) : IRequest<Guid?>;
