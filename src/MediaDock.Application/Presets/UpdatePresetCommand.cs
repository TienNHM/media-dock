using MediatR;

namespace MediaDock.Application.Presets;

public sealed record UpdatePresetCommand(Guid Id, string Name, string? Description, string SpecJson, bool IsDefault)
    : IRequest<bool>;
