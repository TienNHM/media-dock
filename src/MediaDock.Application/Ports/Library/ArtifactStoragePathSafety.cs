namespace MediaDock.Application.Ports.Library;

/// <summary>
/// Path containment for files served or deleted from the configured downloads directory.
/// Requires arguments already normalized via <see cref="Path.GetFullPath(string)"/>.
/// </summary>
public static class ArtifactStoragePathSafety
{
    public static bool IsStrictChildOfRoot(string downloadsRootFullPath, string filePathFullPath)
    {
        var p = downloadsRootFullPath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var c = filePathFullPath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (c.Length <= p.Length)
            return false;

        return c.StartsWith(p + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            || c.StartsWith(p + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }
}
