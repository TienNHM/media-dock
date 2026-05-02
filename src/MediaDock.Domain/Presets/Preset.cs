namespace MediaDock.Domain.Presets;

/// <summary>
/// Timestamps are persisted as UTC.
/// </summary>
public sealed class Preset
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SpecJson { get; set; } = "{}";
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
