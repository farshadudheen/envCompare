using System.Text.Json;
using EnvCompare.Core.Models;
using Umbraco.Cms.Core.Models;
using Umbraco.Extensions;

namespace EnvCompare.Infrastructure.Mapping;

/// <summary>
/// Serializes Umbraco property values into stable strings for comparison.
/// </summary>
internal static class PropertyValueSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false
    };

    public static IReadOnlyList<PropertyValueSnapshot> ExtractContentProperties(IContent content)
    {
        ArgumentNullException.ThrowIfNull(content);

        var results = new List<PropertyValueSnapshot>();

        foreach (var property in content.Properties)
        {
            if (property.PropertyType.Variations.VariesByCulture())
            {
                foreach (var culture in content.AvailableCultures ?? [])
                {
                    results.Add(new PropertyValueSnapshot(
                        property.Alias,
                        culture,
                        Serialize(content.GetValue(property.Alias, culture))));
                }
            }
            else
            {
                results.Add(new PropertyValueSnapshot(
                    property.Alias,
                    Culture: null,
                    Serialize(content.GetValue(property.Alias))));
            }
        }

        return results
            .OrderBy(p => p.Alias, StringComparer.OrdinalIgnoreCase)
            .ThenBy(p => p.Culture ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static IReadOnlyList<PropertyValueSnapshot> ExtractMediaProperties(IMedia media)
    {
        ArgumentNullException.ThrowIfNull(media);

        var results = new List<PropertyValueSnapshot>();

        foreach (var property in media.Properties)
        {
            results.Add(new PropertyValueSnapshot(
                property.Alias,
                Culture: null,
                Serialize(media.GetValue(property.Alias))));
        }

        return results
            .OrderBy(p => p.Alias, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static string? Serialize(object? value)
    {
        if (value is null)
        {
            return null;
        }

        return value switch
        {
            string text => text,
            bool boolean => boolean ? "true" : "false",
            int or long or decimal or double or float => Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture),
            DateTime dateTime => dateTime.ToUniversalTime().ToString("O"),
            DateTimeOffset dateTimeOffset => dateTimeOffset.ToUniversalTime().ToString("O"),
            Guid guid => guid.ToString("D"),
            _ => JsonSerializer.Serialize(value, JsonOptions)
        };
    }
}
