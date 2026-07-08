using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Shared helpers for tree-based comparison modules.
/// </summary>
internal static class ComparisonHelpers
{
    public const int DefaultPageSize = 100;
    public const int MaxNodes = 5000;

    public static bool IsIgnoredPath(string? path, EnvCompareOptions options)
    {
        if (string.IsNullOrWhiteSpace(path) || options.IgnoredPaths.Count == 0)
        {
            return false;
        }

        return options.IgnoredPaths.Any(ignored =>
            !string.IsNullOrWhiteSpace(ignored) &&
            path.Contains(ignored, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsIgnoredContentType(string? alias, EnvCompareOptions options)
    {
        if (string.IsNullOrWhiteSpace(alias) || options.IgnoredContentTypes.Count == 0)
        {
            return false;
        }

        return options.IgnoredContentTypes.Any(ignored =>
            string.Equals(ignored, alias, StringComparison.OrdinalIgnoreCase));
    }

    public static ComparisonItem CreateItem(
        string moduleAlias,
        string id,
        string name,
        string? contentType,
        string? path,
        DifferenceType status,
        string? environmentAValue,
        string? environmentBValue,
        string? differenceSummary,
        string? culture = null)
        => new(
            id,
            name,
            contentType,
            path,
            culture,
            Segment: null,
            status,
            environmentAValue,
            environmentBValue,
            differenceSummary,
            moduleAlias);

    public static string DescribeStatus(DifferenceType status) => status switch
    {
        DifferenceType.Identical => "Identical",
        DifferenceType.Added => "Present only in Environment B",
        DifferenceType.Missing => "Present only in Environment A",
        DifferenceType.Modified => "Modified",
        DifferenceType.Ignored => "Ignored by configuration",
        _ => status.ToString()
    };
}
