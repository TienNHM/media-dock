using MediaDock.Application.Ports.Jobs;
using MediaDock.Domain.Jobs;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Jobs;

public sealed class EfJobRepository(MediaDockDbContext db) : IJobRepository
{
    public async Task AddAsync(Job job, CancellationToken cancellationToken = default) =>
        await db.Jobs.AddAsync(job, cancellationToken);

    public async Task<Job?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await db.Jobs
            .AsSplitQuery()
            .Include(j => j.CurrentSpec)
            .Include(j => j.Progress)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Job>> ListAsync(int take, JobStatus? status, CancellationToken cancellationToken = default)
    {
        var q = db.Jobs.AsNoTracking().AsQueryable();
        if (status.HasValue)
            q = q.Where(j => j.Status == status.Value);
        return await q
            .OrderByDescending(j => j.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public async Task<bool> TryTransitionAsync(
        Guid jobId,
        JobStatus from,
        JobStatus to,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        var job = await db.Jobs.FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);
        if (job is null || job.Status != from)
        {
            await tx.RollbackAsync(cancellationToken);
            return false;
        }

        job.Status = to;
        if (to == JobStatus.Failed || to == JobStatus.FailedPermanent)
        {
            job.LastErrorMessage = reason;
        }

        if (to == JobStatus.Downloading || to == JobStatus.Probing)
            job.StartedAt ??= DateTimeOffset.UtcNow;
        if (to == JobStatus.Completed || to == JobStatus.Cancelled || to == JobStatus.FailedPermanent)
            job.CompletedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return true;
    }

    public async Task ForceStatusAsync(
        Guid jobId,
        JobStatus to,
        string? message,
        string? errorClass = null,
        CancellationToken cancellationToken = default)
    {
        var job = await db.Jobs.FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);
        if (job is null)
            return;
        job.Status = to;
        if (!string.IsNullOrEmpty(message))
            job.LastErrorMessage = message;
        if (!string.IsNullOrEmpty(errorClass))
            job.LastErrorClass = errorClass;
        if (to is JobStatus.Completed or JobStatus.Cancelled or JobStatus.FailedPermanent or JobStatus.Failed)
            job.CompletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }
}
