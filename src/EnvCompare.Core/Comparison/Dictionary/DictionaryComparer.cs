using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Comparison;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Dictionary;

/// <summary>
/// Compares dictionary items and translations between environments.
/// </summary>
public sealed class DictionaryComparer : IComparerModule
{
    private const string ModuleAlias = "dictionary";

    /// <inheritdoc />
    public string Alias => ModuleAlias;

    /// <inheritdoc />
    public string DisplayName => "Dictionary";

    /// <inheritdoc />
    public async Task<ComparisonResult> CompareAsync(
        ComparisonContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        context.Progress?.Report(new ComparisonProgress(Alias, 0, null, "Loading dictionary items A…"));
        var itemsA = await context.EnvironmentA.GetDictionaryItemsAsync(cancellationToken).ConfigureAwait(false);

        context.Progress?.Report(new ComparisonProgress(Alias, itemsA.Count, null, "Loading dictionary items B…"));
        var itemsB = await context.EnvironmentB.GetDictionaryItemsAsync(cancellationToken).ConfigureAwait(false);

        var mapA = itemsA.ToDictionary(i => i.ItemKey, StringComparer.OrdinalIgnoreCase);
        var mapB = itemsB.ToDictionary(i => i.ItemKey, StringComparer.OrdinalIgnoreCase);
        var keys = mapA.Keys.Union(mapB.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var results = new List<ComparisonItem>(keys.Length);

        foreach (var itemKey in keys)
        {
            cancellationToken.ThrowIfCancellationRequested();
            mapA.TryGetValue(itemKey, out var itemA);
            mapB.TryGetValue(itemKey, out var itemB);

            if (itemA is null && itemB is not null)
            {
                results.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    itemB.Key.ToString("D"),
                    itemB.ItemKey,
                    "Dictionary Item",
                    path: itemB.ItemKey,
                    DifferenceType.Added,
                    null,
                    DictionaryTranslationComparer.Format(itemB.Translations),
                    ComparisonHelpers.DescribeOnlyInEnvironment(context.EnvironmentB.Name)));
                continue;
            }

            if (itemA is not null && itemB is null)
            {
                results.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    itemA.Key.ToString("D"),
                    itemA.ItemKey,
                    "Dictionary Item",
                    path: itemA.ItemKey,
                    DifferenceType.Missing,
                    DictionaryTranslationComparer.Format(itemA.Translations),
                    null,
                    ComparisonHelpers.DescribeOnlyInEnvironment(context.EnvironmentA.Name)));
                continue;
            }

            var differences = new List<string>();
            var translationDifferences = DictionaryTranslationComparer.FindDifferences(
                itemA!.Translations,
                itemB!.Translations);
            if (translationDifferences.Count > 0)
            {
                differences.Add($"translations ({string.Join(", ", translationDifferences)})");
            }

            if (itemA.ParentKey != itemB.ParentKey)
            {
                differences.Add("parent");
            }

            var status = differences.Count == 0 ? DifferenceType.Identical : DifferenceType.Modified;
            var culture = translationDifferences.Count == 1 ? translationDifferences[0] : null;
            results.Add(ComparisonHelpers.CreateItem(
                ModuleAlias,
                itemA.Key.ToString("D"),
                itemA.ItemKey,
                "Dictionary Item",
                path: itemA.ItemKey,
                status,
                DictionaryTranslationComparer.Format(itemA.Translations),
                DictionaryTranslationComparer.Format(itemB.Translations),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}",
                culture: culture));
        }

        context.Progress?.Report(new ComparisonProgress(Alias, results.Count, results.Count, "Dictionary comparison complete."));
        return ComparisonResult.FromItems(results);
    }
}
