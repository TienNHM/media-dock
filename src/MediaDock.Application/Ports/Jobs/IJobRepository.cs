using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Ports.Jobs;

public interface IJobRepository
{
    Task<Job?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Job>> ListAsync(int take, JobStatus? status, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Job>> ListRecentCompletedWithArtifactsAsync(int take, CancellationToken cancellationToken = default);
    Task AddAsync(Job job, CancellationToken cancellationToken = default);

    /// <summary>Remove a tracked <see cref="Job"/> aggregate (tracked load required). Cascades dependents.</summary>
    void Remove(Job job);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<bool> TryTransitionAsync(
        Guid jobId,
        JobStatus from,
        JobStatus to,
        string? reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets terminal/intermediate status without strict from-guard (used for failure recovery paths).
    /// </summary>
    Task ForceStatusAsync(
        Guid jobId,
        JobStatus to,
        string? message,
        string? errorClass = null,
        CancellationToken cancellationToken = default);

    Task UpsertProgressAsync(
        Guid jobId,
        string phase,
        long? bytesDone,
        long? bytesTotal,
        CancellationToken cancellationToken = default);

    Task ReplaceArtifactsAsync(Guid jobId, IEnumerable<JobArtifact> artifacts, CancellationToken cancellationToken = default);
}
