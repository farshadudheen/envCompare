using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Content;

/// <summary>
/// Compares content trees between two environments (keys, hierarchy, type, sort order).
/// Property-value diffs are expanded in Step 6.
/// </summary>
public sealed class ContentComparer : IComparerModule
{
    /// <inheritdoc />
    public string Alias => "content";

    /// <inheritdoc />
    public string DisplayName => "Content";

    /// <inheritdoc />
    public async Task<ComparisonResult> CompareAsync(
        ComparisonContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        context.Progress?.Report(new ComparisonProgress(Alias, 0, null, "Loading content tree A…"));
        var treeA = await TreeLoader.LoadContentTreeAsync(context.EnvironmentA, cancellationToken)
            .ConfigureAwait(false);

        context.Progress?.Report(new ComparisonProgress(Alias, treeA.Count, null, "Loading content tree B…"));
        var treeB = await TreeLoader.LoadContentTreeAsync(context.EnvironmentB, cancellationToken)
            .ConfigureAwait(false);

        var mapA = treeA.ToDictionary(n => n.Key);
        var mapB = treeB.ToDictionary(n => n.Key);
        var keys = mapA.Keys.Union(mapB.Keys).ToArray();
        var items = new List<ComparisonItem>(keys.Length);
        var processed = 0;

        foreach (var key in keys)
        {
            cancellationToken.ThrowIfCancellationRequested();
            processed++;
            if (processed % 25 == 0)
            {
                context.Progress?.Report(new ComparisonProgress(
                    Alias,
                    processed,
                    keys.Length,
                    $"Comparing content ({processed}/{keys.Length})…"));
            }

            mapA.TryGetValue(key, out var nodeA);
            mapB.TryGetValue(key, out var nodeB);

            var path = nodeA?.Path ?? nodeB?.Path;
            var typeAlias = nodeA?.ContentTypeAlias ?? nodeB?.ContentTypeAlias;
            var name = nodeA?.Name ?? nodeB?.Name ?? key.ToString("D");

            if (ComparisonHelpers.IsIgnoredPath(path, context.Options) ||
                ComparisonHelpers.IsIgnoredContentType(typeAlias, context.Options))
            {
                items.Add(ComparisonHelpers.CreateItem(
                    Alias,
                    key.ToString("D"),
                    name,
                    typeAlias,
                    path,
                    DifferenceType.Ignored,
                    Format(nodeA),
                    Format(nodeB),
                    ComparisonHelpers.DescribeStatus(DifferenceType.Ignored)));
                continue;
            }

            if (nodeA is null && nodeB is not null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    Alias,
                    key.ToString("D"),
                    nodeB.Name,
                    nodeB.ContentTypeAlias,
                    nodeB.Path,
                    DifferenceType.Added,
                    null,
                    Format(nodeB),
                    ComparisonHelpers.DescribeStatus(DifferenceType.Added)));
                continue;
            }

            if (nodeA is not null && nodeB is null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    Alias,
                    key.ToString("D"),
                    nodeA.Name,
                    nodeA.ContentTypeAlias,
                    nodeA.Path,
                    DifferenceType.Missing,
                    Format(nodeA),
                    null,
                    ComparisonHelpers.DescribeStatus(DifferenceType.Missing)));
                continue;
            }

            var differences = new List<string>();
            if (!string.Equals(nodeA!.Name, nodeB!.Name, StringComparison.Ordinal))
            {
                differences.Add("name");
            }

            if (!string.Equals(nodeA.ContentTypeAlias, nodeB.ContentTypeAlias, StringComparison.OrdinalIgnoreCase))
            {
                differences.Add("content type");
            }

            if (nodeA.ParentKey != nodeB.ParentKey)
            {
                differences.Add("parent");
            }

            if (nodeA.SortOrder != nodeB.SortOrder)
            {
                differences.Add("sort order");
            }

            if (nodeA.Level != nodeB.Level)
            {
                differences.Add("hierarchy level");
            }

            if (!CulturesEqual(nodeA.Cultures, nodeB.Cultures))
            {
                differences.Add("cultures");
            }

            if (nodeA.Published != nodeB.Published)
            {
                differences.Add("published state");
            }

            var status = differences.Count == 0 ? DifferenceType.Identical : DifferenceType.Modified;
            items.Add(ComparisonHelpers.CreateItem(
                Alias,
                key.ToString("D"),
                nodeA.Name,
                nodeA.ContentTypeAlias,
                nodeA.Path,
                status,
                Format(nodeA),
                Format(nodeB),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}"));
        }

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, items.Count, "Content comparison complete."));
        return ComparisonResult.FromItems(items);
    }

    private static bool CulturesEqual(IReadOnlyList<string> a, IReadOnlyList<string> b)
    {
        if (a.Count != b.Count)
        {
            return false;
        }

        return a.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .SequenceEqual(b.OrderBy(x => x, StringComparer.OrdinalIgnoreCase), StringComparer.OrdinalIgnoreCase);
    }

    private static string? Format(ContentNodeSnapshot? node)
    {
        if (node is null)
        {
            return null;
        }

        return $"{node.Name} | {node.ContentTypeAlias} | parent={node.ParentKey} | sort={node.SortOrder} | level={node.Level} | published={node.Published}";
    }
}
