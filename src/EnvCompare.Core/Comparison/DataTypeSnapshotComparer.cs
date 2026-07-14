using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Compares data type definitions.
/// </summary>
internal static class DataTypeSnapshotComparer
{
    public static IReadOnlyList<string> FindDifferences(DataTypeSnapshot? left, DataTypeSnapshot? right)
    {
        if (left is null || right is null)
        {
            return [];
        }

        var differences = new List<string>();

        if (!string.Equals(left.EditorAlias, right.EditorAlias, StringComparison.OrdinalIgnoreCase))
        {
            differences.Add("editor");
        }

        if (!string.Equals(left.EditorUiAlias, right.EditorUiAlias, StringComparison.OrdinalIgnoreCase))
        {
            differences.Add("editor UI");
        }

        if (!string.Equals(left.DatabaseType, right.DatabaseType, StringComparison.OrdinalIgnoreCase))
        {
            differences.Add("database type");
        }

        if (!string.Equals(left.ConfigurationJson, right.ConfigurationJson, StringComparison.Ordinal))
        {
            differences.Add("configuration");
        }

        return differences;
    }

    public static string Format(DataTypeSnapshot? dataType)
    {
        if (dataType is null)
        {
            return "(missing)";
        }

        return string.Join(
            Environment.NewLine,
            [
                $"{dataType.Name} | editor={dataType.EditorAlias} | ui={dataType.EditorUiAlias ?? "(none)"} | storage={dataType.DatabaseType}",
                $"Key: {dataType.Key:D}",
                "Configuration:",
                string.IsNullOrWhiteSpace(dataType.ConfigurationJson) ? "  (none)" : dataType.ConfigurationJson
            ]);
    }
}
