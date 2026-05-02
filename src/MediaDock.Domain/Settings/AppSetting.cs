namespace MediaDock.Domain.Settings;

public enum SettingScope
{
    User = 0,
    Machine = 1
}

public sealed class AppSetting
{
    public string Key { get; set; } = string.Empty;
    public string ValueJson { get; set; } = "{}";
    public SettingScope Scope { get; set; } = SettingScope.User;
}
