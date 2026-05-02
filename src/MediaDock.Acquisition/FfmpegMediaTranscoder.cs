using CliWrap;
using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MediaDock.Acquisition;

public sealed class FfmpegMediaTranscoder(
    IOptions<AcquisitionOptions> options,
    ILogger<FfmpegMediaTranscoder> logger) : IMediaTranscoder
{
    public async Task TranscodeAsync(TranscodeSpec spec, CancellationToken cancellationToken = default)
    {
        var ffmpeg = options.Value.FfmpegPath;
        if (string.IsNullOrWhiteSpace(ffmpeg) || !File.Exists(ffmpeg))
        {
            logger.LogInformation("ffmpeg not configured; skipping transcode for job {JobId}", spec.JobId);
            return;
        }

        await CliWrap.Cli.Wrap(ffmpeg)
            .WithArguments(["-y", "-i", spec.InputPath, spec.OutputPath])
            .WithValidation(CommandResultValidation.ZeroExitCode)
            .ExecuteAsync(cancellationToken);
    }
}
