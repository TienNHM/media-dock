namespace MediaDock.Application.Ports.Acquisition;

public sealed record DownloadSpec(
    Guid JobId,
    string Url,
    string OutputDirectory,
    string? FormatSelector,
    string? ProxyUrl,
    string? CookiesFilePath,
    bool WriteSubtitles,
    bool WriteThumbnail);

public interface IMediaDownloader
{
    IAsyncEnumerable<DownloadProgressEvent> DownloadAsync(
        DownloadSpec spec,
        CancellationToken cancellationToken = default);
}

public sealed record DownloadProgressEvent(
    string Phase,
    double? Percent,
    long? BytesDone,
    long? BytesTotal,
    string? RawLine);
