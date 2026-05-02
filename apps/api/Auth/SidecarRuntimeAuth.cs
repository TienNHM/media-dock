namespace MediaDock.Api.Auth;

/// <summary>
/// Effective auth token for local sidecar (may be null in Development for ng serve ergonomics).
/// </summary>
public sealed class SidecarRuntimeAuth
{
    public string? Token { get; init; }
}
