using MediatR;
using MediaDock.Application.Ports.Acquisition;
using MediaDock.Application.Ports.Jobs;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.Library;

public sealed class GetLibraryArtifactPreviewQueryHandler(IJobRepository jobs, IDownloadsPathResolver downloadPaths)
    : IRequestHandler<GetLibraryArtifactPreviewQuery, LibraryArtifactPreview?>
{
    public async Task<LibraryArtifactPreview?> Handle(
        GetLibraryArtifactPreviewQuery request,
        CancellationToken cancellationToken)
    {
        var job = await jobs.GetByIdAsync(request.JobId, cancellationToken);
        if (job?.Status != JobStatus.Completed)
            return null;

        var artifact = job.Artifacts.FirstOrDefault(a => a.Id == request.ArtifactId);
        if (artifact is null)
            return null;

        if (artifact.Kind is not (ArtifactKind.Video or ArtifactKind.Audio or ArtifactKind.Thumbnail))
            return null;

        var rootDir = Path.GetFullPath(await downloadPaths.GetDownloadsRootAsync(cancellationToken));
        var filePath = Path.GetFullPath(artifact.Path);
        if (!IsUnderDirectory(rootDir, filePath) || !File.Exists(filePath))
            return null;

        var contentType = GuessContentType(filePath);
        return new LibraryArtifactPreview(filePath, contentType, Path.GetFileName(filePath));
    }

    private static bool IsUnderDirectory(string parentDir, string filePath)
    {
        var p = parentDir.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var c = filePath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (c.Length <= p.Length)
            return false;
        return c.StartsWith(p + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            || c.StartsWith(p + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }

    private static string GuessContentType(string path) =>
        Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mkv" => "video/x-matroska",
            ".mov" => "video/quicktime",
            ".m4v" => "video/x-m4v",
            ".avi" => "video/x-msvideo",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".opus" => "audio/opus",
            ".mp3" => "audio/mpeg",
            ".m4a" => "audio/mp4",
            ".aac" => "audio/aac",
            ".flac" => "audio/flac",
            ".wav" => "audio/wav",
            _ => "application/octet-stream"
        };
}
