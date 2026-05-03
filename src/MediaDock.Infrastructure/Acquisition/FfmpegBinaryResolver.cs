using System.Runtime.InteropServices;
using Microsoft.Extensions.Options;

namespace MediaDock.Acquisition;

public sealed class FfmpegBinaryResolver(IOptions<AcquisitionOptions> options)
{
    public string? ResolveFfmpegPath()
    {
        var o = options.Value;
        if (!string.IsNullOrWhiteSpace(o.FfmpegPath) && File.Exists(o.FfmpegPath))
            return o.FfmpegPath;

        var exe = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "ffmpeg.exe" : "ffmpeg";
        var local = Path.Combine(AppContext.BaseDirectory, "Resources", "binaries", exe);
        if (File.Exists(local))
            return local;

        return exe;
    }

    /// <summary>Full path to ffmpeg if known; otherwise null (yt-dlp will use PATH).</summary>
    public string? ResolveFullPathForYtDlp()
    {
        var path = ResolveFfmpegPath();
        if (string.IsNullOrWhiteSpace(path))
            return null;

        if (File.Exists(path))
            return Path.GetFullPath(path);

        if (IsOnPath(path))
        {
            var paths = (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator);
            foreach (var p in paths)
            {
                var full = Path.Combine(p.Trim(), path);
                if (File.Exists(full))
                    return Path.GetFullPath(full);
            }
        }

        return null;
    }

    public bool Exists(string? path) =>
        !string.IsNullOrWhiteSpace(path) && (File.Exists(path) || IsOnPath(path));

    private static bool IsOnPath(string fileName)
    {
        var paths = (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator);
        foreach (var p in paths)
        {
            var full = Path.Combine(p.Trim(), fileName);
            if (File.Exists(full))
                return true;
        }

        return false;
    }
}
