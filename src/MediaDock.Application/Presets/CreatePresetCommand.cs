using MediatR;

namespace MediaDock.Application.Presets;

public sealed record CreatePresetCommand(string Name, string? Description, string SpecJson, bool IsDefault = false)
    : IRequest<Guid>;
