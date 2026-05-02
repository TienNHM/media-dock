namespace MediaDock.Domain.Jobs;

/// <summary>
/// Durable job lifecycle aligned with the architecture plan.
/// </summary>
public enum JobStatus
{
    Draft = 0,
    Pending = 1,
    Scheduled = 2,
    Queued = 3,
    Probing = 4,
    Downloading = 5,
    PostProcessing = 6,
    Paused = 7,
    Completed = 8,
    Failed = 9,
    Retrying = 10,
    FailedPermanent = 11,
    Cancelled = 12,
    Interrupted = 13,
    NeedsCookies = 14
}
