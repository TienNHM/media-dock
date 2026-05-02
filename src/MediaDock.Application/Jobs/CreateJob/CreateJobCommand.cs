using MediatR;

namespace MediaDock.Application.Jobs.CreateJob;

public sealed record CreateJobCommand(string Url, int Priority = 0, Guid? PresetId = null) : IRequest<Guid>;
