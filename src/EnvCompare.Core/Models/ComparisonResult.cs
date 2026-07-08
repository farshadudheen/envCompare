namespace EnvCompare.Core.Models;

/// <summary>
/// Aggregate result produced by the comparison engine or a single comparer module.
/// </summary>
/// <param name="Items">Compared items.</param>
/// <param name="TotalCompared">Total items evaluated.</param>
/// <param name="IdenticalCount">Count of identical items.</param>
/// <param name="AddedCount">Count of added items.</param>
/// <param name="MissingCount">Count of missing items.</param>
/// <param name="ModifiedCount">Count of modified items.</param>
/// <param name="IgnoredCount">Count of ignored items.</param>
public sealed record ComparisonResult(
    IReadOnlyList<ComparisonItem> Items,
    int TotalCompared,
    int IdenticalCount,
    int AddedCount,
    int MissingCount,
    int ModifiedCount,
    int IgnoredCount)
{
    /// <summary>
    /// Creates an empty comparison result.
    /// </summary>
    public static ComparisonResult Empty { get; } = new([], 0, 0, 0, 0, 0, 0);

    /// <summary>
    /// Builds a result by aggregating item statuses.
    /// </summary>
    public static ComparisonResult FromItems(IReadOnlyList<ComparisonItem> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        var identical = 0;
        var added = 0;
        var missing = 0;
        var modified = 0;
        var ignored = 0;

        foreach (var item in items)
        {
            switch (item.Status)
            {
                case DifferenceType.Identical:
                    identical++;
                    break;
                case DifferenceType.Added:
                    added++;
                    break;
                case DifferenceType.Missing:
                    missing++;
                    break;
                case DifferenceType.Modified:
                    modified++;
                    break;
                case DifferenceType.Ignored:
                    ignored++;
                    break;
            }
        }

        return new ComparisonResult(
            items,
            items.Count,
            identical,
            added,
            missing,
            modified,
            ignored);
    }

    /// <summary>
    /// Merges multiple module results into one aggregate.
    /// </summary>
    public static ComparisonResult Merge(IEnumerable<ComparisonResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);
        var items = results.SelectMany(r => r.Items).ToArray();
        return FromItems(items);
    }
}
