namespace MediaDock.Domain.Jobs;

/// <summary>
/// <see cref="UpdatedAt"/> is persisted as UTC.
/// </summary>
public sealed class JobProgress
{
    public Guid JobId { get; set; }
    public long? BytesDone { get; set; }
    public long? BytesTotal { get; set; }
    public double? SpeedBps { get; set; }
    public int? EtaSeconds { get; set; }
    public string Phase { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public Job? Job { get; set; }
}
