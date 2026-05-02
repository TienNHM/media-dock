namespace MediaDock.Domain.Jobs;

public sealed class Job
{
    public Guid Id { get; set; }
    public Guid? ParentJobId { get; set; }
    public Guid? LineageRootId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string SourcePlatform { get; set; } = "unknown";
    public JobStatus Status { get; set; } = JobStatus.Draft;
    public int Priority { get; set; }
    public Guid? PresetId { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public int Attempt { get; set; }
    public string? LastErrorClass { get; set; }
    public string? LastErrorMessage { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public JobSpec? CurrentSpec { get; set; }
    public JobProgress? Progress { get; set; }
    public ICollection<JobArtifact> Artifacts { get; set; } = new List<JobArtifact>();
}
