namespace MediaDock.Application.Ports.Progress;

public sealed record JobProgressDto(
    Guid JobId,
    string Phase,
    double? Percent,
    long? BytesDone,
    long? BytesTotal,
    DateTime Timestamp);

public interface IJobProgressPublisher
{
    Task PublishAsync(JobProgressDto progress, CancellationToken cancellationToken = default);
}
