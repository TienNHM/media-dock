using MediaDock.Application.Ports.Presets;
using MediaDock.Domain.Presets;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Presets;

public sealed class EfPresetRepository(MediaDockDbContext db) : IPresetRepository
{
    public Task AddAsync(Preset preset, CancellationToken cancellationToken = default) =>
        db.Presets.AddAsync(preset, cancellationToken).AsTask();

    public Task<Preset?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Presets.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Preset>> ListAsync(CancellationToken cancellationToken = default) =>
        await db.Presets
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Name)
            .ToListAsync(cancellationToken);

    public void Remove(Preset preset) => db.Presets.Remove(preset);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
