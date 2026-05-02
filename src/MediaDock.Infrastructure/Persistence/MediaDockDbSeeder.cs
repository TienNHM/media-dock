using MediaDock.Application.Jobs;
using MediaDock.Application.Ports.Presets;
using MediaDock.Domain.Presets;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MediaDock.Infrastructure.Persistence;

/// <summary>Ensures at least one download preset exists for the UI.</summary>
public sealed class MediaDockDbSeeder(IServiceScopeFactory scopeFactory, ILogger<MediaDockDbSeeder> logger)
    : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var presets = scope.ServiceProvider.GetRequiredService<IPresetRepository>();
        if ((await presets.ListAsync(cancellationToken)).Count > 0)
            return;

        var now = DateTime.UtcNow;
        await presets.AddAsync(
            new Preset
            {
                Id = Guid.CreateVersion7(),
                Name = "Default (best audio+video)",
                Description = "yt-dlp format bv*+ba/b",
                SpecJson = JobSpecJson.DefaultJson(),
                IsDefault = true,
                CreatedAt = now,
                UpdatedAt = now
            },
            cancellationToken);
        await presets.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded default download preset.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
