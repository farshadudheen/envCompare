using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Media;

/// <summary>
/// Compares media trees between two environments.
/// </summary>
public sealed class MediaComparer : IComparerModule
{
    /// <inheritdoc />
    public string Alias => "media";

    /// <inheritdoc />
    public string DisplayName => "Media";

    /// <inheritdoc />
    public async Task<ComparisonResult> CompareAsync(
        ComparisonContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        context.Progress?.Report(new ComparisonProgress(Alias, 0, null, "Loading media tree A…"));
        var treeA = await TreeLoader.LoadMediaTreeAsync(context.EnvironmentA, cancellationToken)
            .ConfigureAwait(false);

        context.Progress?.Report(new ComparisonProgress(Alias, treeA.Count, null, "Loading media tree B…"));
        var treeB = await TreeLoader.LoadMediaTreeAsync(context.EnvironmentB, cancellationToken)
            .ConfigureAwait(false);

        var mapA = treeA.ToDictionary(n => n.Key);
        var mapB = treeB.ToDictionary(n => n.Key);
        var keys = mapA.Keys.Union(mapB.Keys).ToArray();
        var items = new List<ComparisonItem>(keys.Length);

        foreach (var key in keys)
        {
            cancellationToken.ThrowIfCancellationRequested();
            mapA.TryGetValue(key, out var nodeA);
            mapB.TryGetValue(key, out var nodeB);

            var path = nodeA?.Path ?? nodeB?.Path;
            var typeAlias = nodeA?.MediaTypeAlias ?? nodeB?.MediaTypeAlias;
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
                    nodeB.MediaTypeAlias,
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
                    nodeA.MediaTypeAlias,
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

            if (!string.Equals(nodeA.MediaTypeAlias, nodeB.MediaTypeAlias, StringComparison.OrdinalIgnoreCase))
            {
                differences.Add("media type");
            }

            if (nodeA.ParentKey != nodeB.ParentKey)
            {
                differences.Add("parent");
            }

            if (nodeA.SortOrder != nodeB.SortOrder)
            {
                differences.Add("sort order");
            }

            if (!string.Equals(nodeA.FileName, nodeB.FileName, StringComparison.OrdinalIgnoreCase))
            {
                differences.Add("filename");
            }

            var propertyDifferences = PropertySnapshotComparer.FindDifferences(
                nodeA.Properties,
                nodeB.Properties,
                context.Options);
            if (propertyDifferences.Count > 0)
            {
                differences.Add($"properties ({string.Join(", ", propertyDifferences)})");
            }

            var status = differences.Count == 0 ? DifferenceType.Identical : DifferenceType.Modified;
            items.Add(ComparisonHelpers.CreateItem(
                Alias,
                key.ToString("D"),
                nodeA.Name,
                nodeA.MediaTypeAlias,
                nodeA.Path,
                status,
                Format(nodeA),
                Format(nodeB),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}"));
        }

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, items.Count, "Media comparison complete."));
        return ComparisonResult.FromItems(items);
    }

    private static string? Format(MediaNodeSnapshot? node)
    {
        if (node is null)
        {
            return null;
        }

        return string.Join(
            Environment.NewLine,
            $"{node.Name} | {node.MediaTypeAlias} | file={node.FileName ?? "(none)"} | parent={node.ParentKey} | sort={node.SortOrder}",
            "Properties:",
            PropertySnapshotComparer.FormatProperties(node.Properties));
    }
}
