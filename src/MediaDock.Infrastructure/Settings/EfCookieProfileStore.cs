using System.Text.Json;
using MediaDock.Application.Ports.Settings;
using MediaDock.Domain.Settings;
using MediaDock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Settings;

public sealed class EfCookieProfileStore(MediaDockDbContext db) : ICookieProfileStore
{
    private const string Key = "CookieProfiles";

    public async Task<IReadOnlyList<CookieProfileDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var row = await db.Settings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == Key && x.Scope == SettingScope.Machine, cancellationToken);
        if (row is null || string.IsNullOrWhiteSpace(row.ValueJson))
            return Array.Empty<CookieProfileDto>();

        try
        {
            var items = JsonSerializer.Deserialize<List<CookieProfileJson>>(row.ValueJson);
            if (items is null)
                return Array.Empty<CookieProfileDto>();
            return items
                .Select(x => new CookieProfileDto(x.Id, x.Name, x.FilePath, x.CreatedAt))
                .ToList();
        }
        catch
        {
            return Array.Empty<CookieProfileDto>();
        }
    }

    public async Task SaveAllAsync(IReadOnlyList<CookieProfileDto> profiles, CancellationToken cancellationToken = default)
    {
        var payload = JsonSerializer.Serialize(
            profiles.Select(p => new CookieProfileJson(p.Id, p.Name, p.FilePath, p.CreatedAt)).ToList());
        var row = await db.Settings.FirstOrDefaultAsync(x => x.Key == Key && x.Scope == SettingScope.Machine, cancellationToken);
        if (row is null)
        {
            await db.Settings.AddAsync(
                new AppSetting { Key = Key, Scope = SettingScope.Machine, ValueJson = payload },
                cancellationToken);
        }
        else
            row.ValueJson = payload;

        await db.SaveChangesAsync(cancellationToken);
    }

    private sealed record CookieProfileJson(Guid Id, string Name, string FilePath, DateTime CreatedAt);
}
