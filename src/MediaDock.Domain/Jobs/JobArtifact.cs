namespace MediaDock.Domain.Jobs;

public enum ArtifactKind
{
    Video = 0,
    Audio = 1,
    Subtitle = 2,
    Thumbnail = 3,
    Metadata = 4
}

public sealed class JobArtifact
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public ArtifactKind Kind { get; set; }
    public string Path { get; set; } = string.Empty;
    public long? SizeBytes { get; set; }
    public string? Sha256 { get; set; }
    public string? MimeType { get; set; }
    public Job? Job { get; set; }
}
