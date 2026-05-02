namespace MediaDock.Domain.Jobs;

/// <summary>
/// Immutable resolved spec per job attempt (stored as JSON).
/// </summary>
public sealed class JobSpec
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public int Attempt { get; set; }
    public string SpecJson { get; set; } = "{}";
    public Job? Job { get; set; }
}
