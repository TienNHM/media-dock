using MediaDock.Application.Ports.Jobs;
using MediaDock.Infrastructure.Jobs;
using MediaDock.Infrastructure.Persistence;
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
        return services;
    }

    public static async Task EnsureDatabaseAsync(this IServiceProvider sp, CancellationToken cancellationToken = default)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MediaDockDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }
}
