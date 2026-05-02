namespace MediaDock.Acquisition;

public sealed class AcquisitionOptions
{
    public const string SectionName = "Acquisition";

    /// <summary>Optional explicit path to yt-dlp binary.</summary>
    public string? YtDlpPath { get; set; }

    /// <summary>Optional explicit path to ffmpeg binary.</summary>
    public string? FfmpegPath { get; set; }

    /// <summary>When true and binaries are missing, probe/download use safe stubs for dev/CI.</summary>
    public bool UseStubWhenBinaryMissing { get; set; } = true;
}
