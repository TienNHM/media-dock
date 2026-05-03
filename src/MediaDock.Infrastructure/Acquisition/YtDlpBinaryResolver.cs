using System.Runtime.InteropServices;
using Microsoft.Extensions.Options;

namespace MediaDock.Acquisition;

public sealed class YtDlpBinaryResolver(IOptions<AcquisitionOptions> options)
{
    public string? ResolveYtDlpPath()
    {
        var o = options.Value;
        if (!string.IsNullOrWhiteSpace(o.YtDlpPath) && File.Exists(o.YtDlpPath))
            return o.YtDlpPath;

        var exe = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "yt-dlp.exe" : "yt-dlp";
        var local = Path.Combine(AppContext.BaseDirectory, "Resources", "binaries", exe);
        if (File.Exists(local))
            return local;

        // PATH fallback (dev machines)
        return exe;
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
