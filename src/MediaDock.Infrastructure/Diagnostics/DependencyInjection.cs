using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace MediaDock.Diagnostics;

public static class DependencyInjection
{
    public static IHealthChecksBuilder AddMediaDockBinaryHealthCheck(this IHealthChecksBuilder builder) =>
        builder.AddCheck<BinaryHealthCheck>("binaries");
}
