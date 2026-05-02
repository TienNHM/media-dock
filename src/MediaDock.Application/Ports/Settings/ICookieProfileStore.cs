namespace MediaDock.Application.Ports.Settings;

public sealed record CookieProfileDto(Guid Id, string Name, string FilePath, DateTime CreatedAt);

public interface ICookieProfileStore
{
    Task<IReadOnlyList<CookieProfileDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task SaveAllAsync(IReadOnlyList<CookieProfileDto> profiles, CancellationToken cancellationToken = default);
}
