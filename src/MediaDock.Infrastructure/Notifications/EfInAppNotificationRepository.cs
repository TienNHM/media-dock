using MediaDock.Application.Ports.Notifications;
using MediaDock.Domain.Notifications;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Notifications;

public sealed class EfInAppNotificationRepository(MediaDockDbContext db) : IInAppNotificationRepository
{
    public async Task AddAsync(InAppNotification notification, CancellationToken cancellationToken = default)
    {
        await db.Notifications.AddAsync(notification, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InAppNotification>> ListAsync(int take, CancellationToken cancellationToken = default) =>
        await db.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);

    public async Task<int> CountUnreadAsync(CancellationToken cancellationToken = default) =>
        await db.Notifications.AsNoTracking().CountAsync(n => n.ReadAt == null, cancellationToken);

    public async Task<bool> MarkReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var n = await db.Notifications.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (n is null)
            return false;
        n.ReadAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task MarkAllReadAsync(CancellationToken cancellationToken = default)
    {
        var list = await db.Notifications.Where(n => n.ReadAt == null).ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;
        foreach (var n in list)
            n.ReadAt = now;
        if (list.Count > 0)
            await db.SaveChangesAsync(cancellationToken);
    }
}
