using MediatR;

namespace MediaDock.Application.Jobs.Library;

public sealed record RemoveLibraryJobCommand(Guid JobId) : IRequest<bool>;
