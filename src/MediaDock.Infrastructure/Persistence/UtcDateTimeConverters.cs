using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MediaDock.Infrastructure.Persistence;

/// <summary>
/// Enforces UTC <see cref="DateTimeKind"/> for all persisted timestamps (convention: store and interpret as UTC).
/// </summary>
public static class UtcDateTimeConverters
{
    private static readonly ValueConverter<DateTime, DateTime> NonNull = new(
        v => NormalizeToUtc(v),
        v => NormalizeToUtc(v));

    private static readonly ValueConverter<DateTime?, DateTime?> Nullable = new(
        v => v.HasValue ? NormalizeToUtc(v.Value) : null,
        v => v.HasValue ? NormalizeToUtc(v.Value) : null);

    public static void Apply(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                    property.SetValueConverter(NonNull);
                else if (property.ClrType == typeof(DateTime?))
                    property.SetValueConverter(Nullable);
            }
        }
    }

    private static DateTime NormalizeToUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };
}
