using MediatR;
using MediaDock.Application.Ports.Presets;
using MediaDock.Domain.Presets;

namespace MediaDock.Application.Presets;

public sealed class ListPresetsQueryHandler(IPresetRepository presets)
    : IRequestHandler<ListPresetsQuery, IReadOnlyList<Preset>>
{
    public Task<IReadOnlyList<Preset>> Handle(ListPresetsQuery request, CancellationToken cancellationToken) =>
        presets.ListAsync(cancellationToken);
}
