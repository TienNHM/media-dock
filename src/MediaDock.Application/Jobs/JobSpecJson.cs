using System.Text.Json;

namespace MediaDock.Application.Jobs;

public sealed record ParsedDownloadOptions(
    string FormatSelector,
    bool WriteSubtitles,
    bool WriteThumbnail,
    string? CookiesFilePath);

public static class JobSpecJson
{
    public static ParsedDownloadOptions Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Default();

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var format = root.TryGetProperty("format", out var f) ? f.GetString() ?? "bv*+ba/b" : "bv*+ba/b";
            var subs = root.TryGetProperty("subs", out var s) && s.ValueKind == JsonValueKind.True;
            var thumb = root.TryGetProperty("thumb", out var t) && t.ValueKind == JsonValueKind.True;
            string? cookies = null;
            if (root.TryGetProperty("cookiesPath", out var c) && c.ValueKind == JsonValueKind.String)
                cookies = string.IsNullOrWhiteSpace(c.GetString()) ? null : c.GetString();
            return new ParsedDownloadOptions(format, subs, thumb, cookies);
        }
        catch
        {
            return Default();
        }
    }

    public static string DefaultJson() => """{"format":"bv*+ba/b","subs":false,"thumb":false}""";

    private static ParsedDownloadOptions Default() =>
        new("bv*+ba/b", false, false, null);
}
