using System.Text.Json;
using MediaDock.Application.Ports.Settings;
using MediaDock.Domain.Settings;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Settings;

public sealed class EfDownloadsRootStore(MediaDockDbContext db) : IDownloadsRootStore
{
    public const string Key = "downloads_root_path";

    public async Task<string?> GetPersistedRootAsync(CancellationToken cancellationToken = default)
    {
        var row = await db.Settings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == Key && x.Scope == SettingScope.Machine, cancellationToken);
        if (row is null || string.IsNullOrWhiteSpace(row.ValueJson))
            return null;
        try
        {
            return JsonSerializer.Deserialize<string>(row.ValueJson);
        }
        catch
        {
            return null;
        }
    }

    public async Task SetPersistedRootAsync(string? absolutePathOrNullToClearDatabaseOverride, CancellationToken cancellationToken = default)
    {
        var row = await db.Settings.FirstOrDefaultAsync(x => x.Key == Key && x.Scope == SettingScope.Machine, cancellationToken);
        if (string.IsNullOrWhiteSpace(absolutePathOrNullToClearDatabaseOverride))
        {
            if (row is not null)
                db.Settings.Remove(row);
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        var full = Path.GetFullPath(absolutePathOrNullToClearDatabaseOverride.Trim());
        var json = JsonSerializer.Serialize(full);
        if (row is null)
        {
            await db.Settings.AddAsync(
                new AppSetting { Key = Key, Scope = SettingScope.Machine, ValueJson = json },
                cancellationToken);
        }
        else
            row.ValueJson = json;

        await db.SaveChangesAsync(cancellationToken);
    }
}
