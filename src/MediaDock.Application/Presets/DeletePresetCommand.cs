using MediatR;

namespace MediaDock.Application.Presets;

public sealed record DeletePresetCommand(Guid Id) : IRequest<bool>;
