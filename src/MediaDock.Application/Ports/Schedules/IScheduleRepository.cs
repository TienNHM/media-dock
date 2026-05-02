using MediaDock.Domain.Schedules;

namespace MediaDock.Application.Ports.Schedules;

public interface IScheduleRepository
{
    Task<IReadOnlyList<Schedule>> ListAsync(CancellationToken cancellationToken = default);
    Task<Schedule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Schedule schedule, CancellationToken cancellationToken = default);
    void Remove(Schedule schedule);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
