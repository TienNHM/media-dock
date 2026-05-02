namespace MediaDock.Acquisition;

public static class DownloadsPathHelper
{
    /// <summary>
    /// Resolves the root directory that contains per-job download folders (each job uses a subfolder by job id).
    /// </summary>
    public static string ResolveDownloadsRoot(AcquisitionOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.DownloadsRootPath))
            return Path.GetFullPath(options.DownloadsRootPath);

        var fallback = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MediaDock",
            "downloads");
        return Path.GetFullPath(fallback);
    }

    public static string ResolveJobDownloadDirectory(AcquisitionOptions options, Guid jobId) =>
        Path.Combine(ResolveDownloadsRoot(options), jobId.ToString("N"));
}
