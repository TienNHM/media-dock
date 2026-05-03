namespace MediaDock.Application.Ports.Plugins;

/// <summary>
/// Extension point for post-download transforms (Phase 3).
/// </summary>
public interface IPostDownloadPlugin
{
    string Id { get; }

    Task RunAsync(PostDownloadContext context, CancellationToken cancellationToken = default);
}

public sealed record PostDownloadContext(Guid JobId, IReadOnlyList<string> ArtifactPaths);
