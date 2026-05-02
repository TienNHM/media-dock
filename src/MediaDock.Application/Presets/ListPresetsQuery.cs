using MediatR;
using MediaDock.Domain.Presets;

namespace MediaDock.Application.Presets;

public sealed record ListPresetsQuery : IRequest<IReadOnlyList<Preset>>;
