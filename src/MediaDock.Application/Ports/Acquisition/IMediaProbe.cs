namespace MediaDock.Application.Ports.Acquisition;

public sealed record ProbeResult(
    string Title,
    string? Uploader,
    double? DurationSeconds,
    IReadOnlyList<string> FormatIds);

public interface IMediaProbe
{
    Task<ProbeResult> ProbeAsync(string url, CancellationToken cancellationToken = default);
}
