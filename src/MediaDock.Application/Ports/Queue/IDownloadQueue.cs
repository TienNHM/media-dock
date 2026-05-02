namespace MediaDock.Application.Ports.Queue;

public sealed record JobEnvelope(Guid JobId, int Attempt, string CorrelationId);

public interface IDownloadQueue
{
    ValueTask EnqueueAsync(JobEnvelope envelope, CancellationToken cancellationToken = default);
    ValueTask<JobEnvelope> DequeueAsync(CancellationToken cancellationToken);
}
