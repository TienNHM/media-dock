using MediaDock.Application.Ports.Jobs;
using MediaDock.Domain.Jobs;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Jobs;

public sealed class EfJobRepository(MediaDockDbContext db) : IJobRepository
{
    public async Task AddAsync(Job job, CancellationToken cancellationToken = default) =>
        await db.Jobs.AddAsync(job, cancellationToken);

    public void Remove(Job job) => db.Jobs.Remove(job);

    public async Task<Job?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await db.Jobs
            .AsSplitQuery()
            .Include(j => j.CurrentSpec)
            .Include(j => j.Progress)
            .Include(j => j.Artifacts)
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

    public async Task<IReadOnlyList<Job>> ListRecentCompletedWithArtifactsAsync(
        int take,
        CancellationToken cancellationToken = default) =>
        await db.Jobs
            .AsNoTracking()
            .AsSplitQuery()
            .Include(j => j.Artifacts)
            .Where(j => j.Status == JobStatus.Completed)
            .OrderByDescending(j => j.CompletedAt)
            .Take(take)
            .ToListAsync(cancellationToken);

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
            job.StartedAt ??= DateTime.UtcNow;
        if (to == JobStatus.Completed || to == JobStatus.Cancelled || to == JobStatus.FailedPermanent)
            job.CompletedAt = DateTime.UtcNow;

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
            job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpsertProgressAsync(
        Guid jobId,
        string phase,
        long? bytesDone,
        long? bytesTotal,
        CancellationToken cancellationToken = default)
    {
        var row = await db.JobProgress.FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
        if (row is null)
        {
            row = new JobProgress { JobId = jobId };
            await db.JobProgress.AddAsync(row, cancellationToken);
        }

        row.Phase = phase;
        row.BytesDone = bytesDone;
        row.BytesTotal = bytesTotal;
        row.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task ReplaceArtifactsAsync(
        Guid jobId,
        IEnumerable<JobArtifact> artifacts,
        CancellationToken cancellationToken = default)
    {
        var existing = await db.JobArtifacts.Where(a => a.JobId == jobId).ToListAsync(cancellationToken);
        db.JobArtifacts.RemoveRange(existing);
        foreach (var a in artifacts)
            await db.JobArtifacts.AddAsync(a, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }
}
