namespace MediaDock.Application.Ports.Settings;

public interface IDownloadsRootStore
{
    Task<string?> GetPersistedRootAsync(CancellationToken cancellationToken = default);

    Task SetPersistedRootAsync(string? absolutePathOrNullToClearDatabaseOverride, CancellationToken cancellationToken = default);
}
