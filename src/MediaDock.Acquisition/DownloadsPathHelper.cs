namespace MediaDock.Acquisition;

public static class DownloadsPathHelper
{
    /// <summary>
    /// Resolves the root directory that contains per-job download folders (each job uses a subfolder by job id).
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

    public static string ResolveJobDownloadDirectory(AcquisitionOptions options, Guid jobId, string? persistedDatabasePath = null) =>
        Path.Combine(ResolveDownloadsRoot(options, persistedDatabasePath), jobId.ToString("N"));
}
