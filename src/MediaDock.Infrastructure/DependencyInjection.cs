using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Application.Ports.Notifications;
using MediaDock.Application.Ports.Presets;
using MediaDock.Application.Ports.Schedules;
using MediaDock.Application.Ports.Settings;
using MediaDock.Infrastructure.Downloads;
using MediaDock.Infrastructure.Jobs;
using MediaDock.Infrastructure.Notifications;
using MediaDock.Infrastructure.Persistence;
using MediaDock.Infrastructure.Presets;
using MediaDock.Infrastructure.Schedules;
using MediaDock.Infrastructure.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MediaDock.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string sqliteConnectionString)
    {
        services.AddSingleton<SqlitePragmaInterceptor>();
        services.AddDbContext<MediaDockDbContext>((sp, options) =>
        {
            MediaDockDbContext.ConfigureSqlite(options, sqliteConnectionString);
            options.AddInterceptors(sp.GetRequiredService<SqlitePragmaInterceptor>());
        });
        services.AddScoped<IJobRepository, EfJobRepository>();
        services.AddScoped<IDownloadsRootStore, EfDownloadsRootStore>();
        services.AddScoped<IDownloadsPathResolver, DownloadsPathResolver>();
        services.AddScoped<IPresetRepository, EfPresetRepository>();
        services.AddScoped<IScheduleRepository, EfScheduleRepository>();
        services.AddScoped<ICookieProfileStore, EfCookieProfileStore>();
        services.AddScoped<IInAppNotificationRepository, EfInAppNotificationRepository>();
        services.AddHostedService<MediaDockDbSeeder>();
        services.AddHostedService<ScheduleDispatchHostedService>();
        return services;
    }

    public static async Task EnsureDatabaseAsync(this IServiceProvider sp, CancellationToken cancellationToken = default)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MediaDockDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
