using MediaDock.Acquisition;
using MediaDock.Application;
using MediaDock.Infrastructure;
using MediaDock.Queue;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

/// <summary>
/// Standalone worker host for future SaaS / split deployment (plan §2). Desktop uses <see cref="MediaDock.Api"/> host.
/// </summary>
Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services.AddSerilog();

    var dataDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "MediaDock");
    Directory.CreateDirectory(dataDir);
    var dbPath = Path.Combine(dataDir, "mediadock.db");
    var connectionString = $"Data Source={dbPath}";

    builder.Services.Configure<AcquisitionOptions>(builder.Configuration.GetSection(AcquisitionOptions.SectionName));
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(connectionString);
    builder.Services.AddAcquisition();
    builder.Services.AddQueueInfrastructure();

    var host = builder.Build();

    await using (var scope = host.Services.CreateAsyncScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<MediaDock.Infrastructure.Persistence.MediaDockDbContext>();
        await db.Database.MigrateAsync();
    }

    Log.Information("MediaDock.Worker started (queue-only host).");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Worker terminated unexpectedly");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}
