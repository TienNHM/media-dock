using MediatR;

namespace MediaDock.Application.Jobs.ProcessJob;

public sealed record ProcessDownloadJobCommand(Guid JobId, int Attempt, string CorrelationId)
    : IRequest;
