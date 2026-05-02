using MediaDock.Acquisition;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace MediaDock.Diagnostics;

public sealed class BinaryHealthCheck(
    YtDlpBinaryResolver resolver,
    IOptions<AcquisitionOptions> options) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var path = resolver.ResolveYtDlpPath();
        var exists = resolver.Exists(path);
        if (!exists && options.Value.UseStubWhenBinaryMissing)
            return Task.FromResult(HealthCheckResult.Degraded("yt-dlp missing; stub mode enabled."));
        if (!exists)
            return Task.FromResult(HealthCheckResult.Unhealthy("yt-dlp binary not found."));
        return Task.FromResult(HealthCheckResult.Healthy($"yt-dlp resolved: {path}"));
    }
}
