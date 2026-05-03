using CliWrap;
using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.Logging;

namespace MediaDock.Acquisition;

public sealed class FfmpegMediaTranscoder(
    FfmpegBinaryResolver ffmpegResolver,
    ILogger<FfmpegMediaTranscoder> logger) : IMediaTranscoder
{
    public async Task TranscodeAsync(TranscodeSpec spec, CancellationToken cancellationToken = default)
    {
        var ffmpeg = ffmpegResolver.ResolveFfmpegPath();
        if (string.IsNullOrWhiteSpace(ffmpeg) || !ffmpegResolver.Exists(ffmpeg))
        {
            logger.LogInformation("ffmpeg not found; skipping transcode for job {JobId}", spec.JobId);
            return;
        }

        await CliWrap.Cli.Wrap(ffmpeg)
            .WithArguments(["-y", "-i", spec.InputPath, spec.OutputPath])
            .WithValidation(CommandResultValidation.ZeroExitCode)
            .ExecuteAsync(cancellationToken);
    }
}
