using System.Text.Json;

namespace MediaDock.Application.Schedules;

public sealed record ScheduleJobTemplate(string Url, int Priority = 0, Guid? PresetId = null);

public static class ScheduleJobTemplateJson
{
    public static ScheduleJobTemplate Parse(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var url = root.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "";
            var priority = root.TryGetProperty("priority", out var p) && p.TryGetInt32(out var pi) ? pi : 0;
            Guid? presetId = null;
            if (root.TryGetProperty("presetId", out var pr))
            {
                if (pr.ValueKind == JsonValueKind.String && Guid.TryParse(pr.GetString(), out var g))
                    presetId = g;
                else if (pr.ValueKind == JsonValueKind.Null)
                    presetId = null;
            }

            return new ScheduleJobTemplate(url.Trim(), priority, presetId);
        }
        catch
        {
            return new ScheduleJobTemplate("", 0, null);
        }
    }

    public static string Serialize(ScheduleJobTemplate t) =>
        JsonSerializer.Serialize(new { url = t.Url, priority = t.Priority, presetId = t.PresetId });
}
