using System.Text.Json;
using CliWrap;
using CliWrap.Buffered;
using MediaDock.Application.Ports.Acquisition;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MediaDock.Acquisition;

public sealed class YtDlpMediaProbe(
    YtDlpBinaryResolver resolver,
    IOptions<AcquisitionOptions> options,
    ILogger<YtDlpMediaProbe> logger) : IMediaProbe
{
    public async Task<ProbeResult> ProbeAsync(string url, CancellationToken cancellationToken = default)
    {
        var path = resolver.ResolveYtDlpPath();
        if (!resolver.Exists(path) && options.Value.UseStubWhenBinaryMissing)
        {
            logger.LogWarning("yt-dlp not found; returning stub probe for {Url}", url);
            return StubProbe(url);
        }

        try
        {
            var result = await CliWrap.Cli.Wrap(path!)
                .WithArguments(["-J", "--no-download", "--no-warnings", url])
                .WithValidation(CommandResultValidation.None)
                .ExecuteBufferedAsync(cancellationToken);

            if (result.ExitCode != 0)
            {
                logger.LogWarning("yt-dlp probe failed ({Code}): {Err}", result.ExitCode, result.StandardError);
                return StubProbe(url);
            }

            using var doc = JsonDocument.Parse(result.StandardOutput);
            var root = doc.RootElement;
            var title = root.TryGetProperty("title", out var t) ? t.GetString() ?? "unknown" : "unknown";
            var uploader = root.TryGetProperty("uploader", out var u) ? u.GetString() : null;
            double? duration = root.TryGetProperty("duration", out var d) && d.ValueKind == JsonValueKind.Number
                ? d.GetDouble()
                : null;

            var formats = new List<string>();
            if (root.TryGetProperty("formats", out var f) && f.ValueKind == JsonValueKind.Array)
            {
                foreach (var el in f.EnumerateArray().Take(20))
                {
                    if (el.TryGetProperty("format_id", out var fid))
                        formats.Add(fid.GetString() ?? "");
                }
            }

            return new ProbeResult(title, uploader, duration, formats);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Probe failed for {Url}", url);
            if (options.Value.UseStubWhenBinaryMissing)
                return StubProbe(url);
            throw;
        }
    }

    private static ProbeResult StubProbe(string url) =>
        new("Preview unavailable", null, null, Array.Empty<string>());
}
