using CliWrap;
using CliWrap.Buffered;
using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MediaDock.Acquisition;

public sealed class YtDlpMediaDownloader(
    YtDlpBinaryResolver resolver,
    FfmpegBinaryResolver ffmpegResolver,
    IOptions<AcquisitionOptions> options,
    ILogger<YtDlpMediaDownloader> logger) : IMediaDownloader
{
    public async IAsyncEnumerable<DownloadProgressEvent> DownloadAsync(
        DownloadSpec spec,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var path = resolver.ResolveYtDlpPath();
        if (!resolver.Exists(path) && options.Value.UseStubWhenBinaryMissing)
        {
            logger.LogWarning("yt-dlp not found; stub download for job {JobId}", spec.JobId);
            yield return new DownloadProgressEvent("stub", 0, 0, 100, null);
            await Task.Delay(200, cancellationToken);
            yield return new DownloadProgressEvent("stub", 100, 100, 100, null);
            yield break;
        }

        var args = new List<string>
        {
            "-o", Path.Combine(spec.OutputDirectory, "%(title)s.%(ext)s"),
            "--newline",
            "--no-progress"
        };
        if (!string.IsNullOrEmpty(spec.FormatSelector))
        {
            args.Insert(0, "-f");
            args.Insert(1, spec.FormatSelector);
        }

        var ff = ffmpegResolver.ResolveFullPathForYtDlp();
        if (ff is not null)
        {
            args.Add("--ffmpeg-location");
            args.Add(ff);
        }

        args.Add(spec.Url);

        if (!string.IsNullOrEmpty(spec.ProxyUrl))
        {
            args.Add("--proxy");
            args.Add(spec.ProxyUrl);
        }

        if (!string.IsNullOrEmpty(spec.CookiesFilePath))
        {
            args.Add("--cookies");
            args.Add(spec.CookiesFilePath);
        }

        yield return new DownloadProgressEvent("started", 0, null, null, null);

        var result = await CliWrap.Cli.Wrap(path!)
            .WithArguments(args)
            .WithWorkingDirectory(spec.OutputDirectory)
            .WithValidation(CommandResultValidation.None)
            .ExecuteBufferedAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(result.StandardOutput))
        {
            foreach (var line in result.StandardOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                yield return new DownloadProgressEvent("stdout", null, null, null, line);
        }

        if (!string.IsNullOrWhiteSpace(result.StandardError))
            logger.LogDebug("yt-dlp stderr: {Err}", result.StandardError);

        if (result.ExitCode != 0)
            throw new InvalidOperationException($"yt-dlp exited with code {result.ExitCode}: {result.StandardError}");

        yield return new DownloadProgressEvent("completed", 100, null, null, null);
    }
}
