namespace MediaDock.Acquisition;

public static class DownloadsPathHelper
{
    /// <summary>
    /// Resolves the downloads root directory (videos and sidecar files go directly here, no per-job subfolder).
    /// </summary>
    public static string ResolveDownloadsRoot(AcquisitionOptions options, string? persistedDatabasePath = null)
    {
        if (!string.IsNullOrWhiteSpace(options.DownloadsRootPath))
            return Path.GetFullPath(options.DownloadsRootPath);

        if (!string.IsNullOrWhiteSpace(persistedDatabasePath))
            return Path.GetFullPath(persistedDatabasePath);

        var fallback = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MediaDock",
            "downloads");
        return Path.GetFullPath(fallback);
    }

    /// <summary>Returns the downloads root—the same path as <see cref="ResolveDownloadsRoot"/> (<paramref name="_"/> unused).</summary>
    public static string ResolveJobDownloadDirectory(AcquisitionOptions options, Guid _, string? persistedDatabasePath = null) =>
        ResolveDownloadsRoot(options, persistedDatabasePath);
}
