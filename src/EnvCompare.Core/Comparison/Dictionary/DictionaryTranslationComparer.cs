namespace EnvCompare.Core.Comparison.Dictionary;

/// <summary>
/// Compares dictionary translation snapshots.
/// </summary>
internal static class DictionaryTranslationComparer
{
    public static IReadOnlyList<string> FindDifferences(
        IReadOnlyList<Models.DictionaryTranslationSnapshot>? left,
        IReadOnlyList<Models.DictionaryTranslationSnapshot>? right)
    {
        left ??= [];
        right ??= [];

        var mapLeft = ToMap(left);
        var mapRight = ToMap(right);
        var cultures = mapLeft.Keys.Union(mapRight.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var differences = new List<string>();

        foreach (var culture in cultures)
        {
            mapLeft.TryGetValue(culture, out var valueLeft);
            mapRight.TryGetValue(culture, out var valueRight);

            if (!string.Equals(valueLeft, valueRight, StringComparison.Ordinal))
            {
                differences.Add(culture);
            }
        }

        return differences;
    }

    public static string Format(IReadOnlyList<Models.DictionaryTranslationSnapshot>? translations)
    {
        if (translations is null || translations.Count == 0)
        {
            return "(no translations)";
        }

        return string.Join(
            Environment.NewLine,
            translations
                .OrderBy(t => t.Culture, StringComparer.OrdinalIgnoreCase)
                .Select(t => $"{t.Culture}: {t.Value ?? "(empty)"}"));
    }

    private static Dictionary<string, string?> ToMap(
        IReadOnlyList<Models.DictionaryTranslationSnapshot> translations)
    {
        var map = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        foreach (var translation in translations)
        {
            if (string.IsNullOrWhiteSpace(translation.Culture))
            {
                continue;
            }

            map[translation.Culture] = translation.Value;
        }

        return map;
    }
}
