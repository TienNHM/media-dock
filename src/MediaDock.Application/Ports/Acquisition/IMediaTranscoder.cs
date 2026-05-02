namespace MediaDock.Application.Ports.Acquisition;

public sealed record TranscodeSpec(Guid JobId, string InputPath, string OutputPath, string Mode);

public interface IMediaTranscoder
{
    Task TranscodeAsync(TranscodeSpec spec, CancellationToken cancellationToken = default);
}
