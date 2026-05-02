using MediaDock.Application.Ports.Schedules;
using MediaDock.Domain.Schedules;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Schedules;

public sealed class EfScheduleRepository(MediaDockDbContext db) : IScheduleRepository
{
    public Task AddAsync(Schedule schedule, CancellationToken cancellationToken = default) =>
        db.Schedules.AddAsync(schedule, cancellationToken).AsTask();

    public Task<Schedule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Schedules.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Schedule>> ListAsync(CancellationToken cancellationToken = default) =>
        await db.Schedules.OrderBy(s => s.Cron).ToListAsync(cancellationToken);

    public void Remove(Schedule schedule) => db.Schedules.Remove(schedule);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
