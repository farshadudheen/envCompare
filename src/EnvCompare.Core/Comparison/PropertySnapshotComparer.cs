using System.Text.Json;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Compares normalized property value snapshots between environments.
/// </summary>
internal static class PropertySnapshotComparer
{
    public static IReadOnlyList<string> FindDifferences(
        IReadOnlyList<PropertyValueSnapshot>? left,
        IReadOnlyList<PropertyValueSnapshot>? right,
        EnvCompareOptions options)
    {
        left ??= [];
        right ??= [];

        var mapLeft = ToMap(left, options);
        var mapRight = ToMap(right, options);
        var keys = mapLeft.Keys.Union(mapRight.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var differences = new List<string>();

        foreach (var key in keys)
        {
            mapLeft.TryGetValue(key, out var valueLeft);
            mapRight.TryGetValue(key, out var valueRight);

            if (!string.Equals(valueLeft, valueRight, StringComparison.Ordinal))
            {
                differences.Add(key);
            }
        }

        return differences;
    }

    public static string FormatProperties(IReadOnlyList<PropertyValueSnapshot>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return "(no properties)";
        }

        var lines = properties
            .OrderBy(p => p.Alias, StringComparer.OrdinalIgnoreCase)
            .ThenBy(p => p.Culture ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .Select(FormatPropertyLine);

        return string.Join(Environment.NewLine, lines);
    }

    public static string FormatPropertyLine(PropertyValueSnapshot property)
    {
        var label = string.IsNullOrWhiteSpace(property.Culture)
            ? property.Alias
            : $"{property.Alias} [{property.Culture}]";

        return $"{label}: {property.Value ?? "(empty)"}";
    }

    private static Dictionary<string, string?> ToMap(
        IReadOnlyList<PropertyValueSnapshot> properties,
        EnvCompareOptions options)
    {
        var map = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        foreach (var property in properties)
        {
            if (IsIgnoredProperty(property.Alias, options))
            {
                continue;
            }

            map[MakeKey(property)] = property.Value;
        }

        return map;
    }

    private static string MakeKey(PropertyValueSnapshot property)
        => string.IsNullOrWhiteSpace(property.Culture)
            ? property.Alias
            : $"{property.Alias}@{property.Culture}";

    private static bool IsIgnoredProperty(string alias, EnvCompareOptions options)
    {
        if (string.IsNullOrWhiteSpace(alias) || options.IgnoredProperties.Count == 0)
        {
            return false;
        }

        return options.IgnoredProperties.Any(ignored =>
            string.Equals(ignored, alias, StringComparison.OrdinalIgnoreCase));
    }
}
