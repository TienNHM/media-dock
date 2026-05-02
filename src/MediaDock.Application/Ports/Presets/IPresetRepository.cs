using MediaDock.Domain.Presets;

namespace MediaDock.Application.Ports.Presets;

public interface IPresetRepository
{
    Task<IReadOnlyList<Preset>> ListAsync(CancellationToken cancellationToken = default);
    Task<Preset?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Preset preset, CancellationToken cancellationToken = default);
    void Remove(Preset preset);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
