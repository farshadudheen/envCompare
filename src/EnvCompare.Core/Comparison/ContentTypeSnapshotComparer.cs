using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Compares document and media type definitions.
/// </summary>
internal static class ContentTypeSnapshotComparer
{
    public static IReadOnlyList<string> FindDifferences(ContentTypeSnapshot? left, ContentTypeSnapshot? right)
    {
        if (left is null || right is null)
        {
            return [];
        }

        var differences = new List<string>();

        if (!string.Equals(left.Name, right.Name, StringComparison.Ordinal))
        {
            differences.Add("name");
        }

        if (!string.Equals(left.Icon, right.Icon, StringComparison.Ordinal))
        {
            differences.Add("icon");
        }

        if (left.IsElement != right.IsElement)
        {
            differences.Add("element");
        }

        if (!SequenceEqual(left.Compositions, right.Compositions))
        {
            differences.Add("compositions");
        }

        var propertyDiffs = FindPropertyDifferences(left.Properties, right.Properties);
        if (propertyDiffs.Count > 0)
        {
            differences.Add($"properties ({string.Join(", ", propertyDiffs)})");
        }

        return differences;
    }

    public static string Format(ContentTypeSnapshot? type)
    {
        if (type is null)
        {
            return "(missing)";
        }

        var lines = new List<string>
        {
            $"{type.Alias} | {type.Name} | element={type.IsElement}",
            $"Compositions: {string.Join(", ", type.Compositions)}",
            "Properties:"
        };

        if (type.Properties.Count == 0)
        {
            lines.Add("  (none)");
        }
        else
        {
            foreach (var property in type.Properties)
            {
                lines.Add(
                    $"  {property.Alias} | {property.Name} | datatype={property.DataTypeKey} | mandatory={property.Mandatory} | sort={property.SortOrder} | variations={property.Variations}");
            }
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static IReadOnlyList<string> FindPropertyDifferences(
        IReadOnlyList<ContentTypePropertySnapshot> left,
        IReadOnlyList<ContentTypePropertySnapshot> right)
    {
        var mapLeft = left.ToDictionary(p => p.Alias, StringComparer.OrdinalIgnoreCase);
        var mapRight = right.ToDictionary(p => p.Alias, StringComparer.OrdinalIgnoreCase);
        var aliases = mapLeft.Keys.Union(mapRight.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var differences = new List<string>();

        foreach (var alias in aliases)
        {
            mapLeft.TryGetValue(alias, out var propertyLeft);
            mapRight.TryGetValue(alias, out var propertyRight);

            if (propertyLeft is null)
            {
                differences.Add($"+{alias}");
                continue;
            }

            if (propertyRight is null)
            {
                differences.Add($"-{alias}");
                continue;
            }

            if (!PropertyDefinitionsEqual(propertyLeft, propertyRight))
            {
                differences.Add(alias);
            }
        }

        return differences;
    }

    private static bool PropertyDefinitionsEqual(
        ContentTypePropertySnapshot left,
        ContentTypePropertySnapshot right)
        => string.Equals(left.Name, right.Name, StringComparison.Ordinal)
           && string.Equals(left.DataTypeKey, right.DataTypeKey, StringComparison.OrdinalIgnoreCase)
           && left.Mandatory == right.Mandatory
           && left.SortOrder == right.SortOrder
           && string.Equals(left.Variations, right.Variations, StringComparison.OrdinalIgnoreCase);

    private static bool SequenceEqual(IReadOnlyList<string> left, IReadOnlyList<string> right)
        => left.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .SequenceEqual(right.OrderBy(x => x, StringComparer.OrdinalIgnoreCase), StringComparer.OrdinalIgnoreCase);
}
