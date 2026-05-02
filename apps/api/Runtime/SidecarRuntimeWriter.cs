using System.Reflection;
using System.Text.Json;

namespace MediaDock.Api.Runtime;

/// <summary>
/// Writes port + auth token for Electron to discover the local sidecar (plan §1.2).
/// </summary>
public sealed class SidecarRuntimeWriter(ILogger<SidecarRuntimeWriter> logger)
{
    public async Task WriteAsync(int port, string authToken, CancellationToken cancellationToken = default)
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MediaDock");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, "sidecar-runtime.json");
        var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString();
        var payload = new SidecarRuntimeInfo(port, authToken ?? string.Empty, version);
        await File.WriteAllTextAsync(
            path,
            JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);
        logger.LogInformation("Sidecar runtime written to {Path}", path);
    }
}

public sealed record SidecarRuntimeInfo(int Port, string AuthToken, string? ApplicationVersion);
