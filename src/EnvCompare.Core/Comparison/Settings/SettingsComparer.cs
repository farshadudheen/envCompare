using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Settings;

/// <summary>
/// Compares language/settings snapshots currently exposed by environment providers.
/// Document types, data types, domains, and templates expand in later increments.
/// </summary>
public sealed class SettingsComparer : IComparerModule
{
    /// <inheritdoc />
    public string Alias => "settings";

    /// <inheritdoc />
    public string DisplayName => "Settings";

    /// <inheritdoc />
    public async Task<ComparisonResult> CompareAsync(
        ComparisonContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        context.Progress?.Report(new ComparisonProgress(Alias, 0, null, "Loading languages…"));

        var languagesA = await context.EnvironmentA.GetLanguagesAsync(cancellationToken).ConfigureAwait(false);
        var languagesB = await context.EnvironmentB.GetLanguagesAsync(cancellationToken).ConfigureAwait(false);

        var mapA = languagesA.ToDictionary(l => l.IsoCode, StringComparer.OrdinalIgnoreCase);
        var mapB = languagesB.ToDictionary(l => l.IsoCode, StringComparer.OrdinalIgnoreCase);
        var codes = mapA.Keys.Union(mapB.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var items = new List<ComparisonItem>(codes.Length);

        foreach (var code in codes)
        {
            cancellationToken.ThrowIfCancellationRequested();
            mapA.TryGetValue(code, out var langA);
            mapB.TryGetValue(code, out var langB);

            if (langA is null && langB is not null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    Alias,
                    code,
                    langB.CultureName,
                    "Language",
                    path: null,
                    DifferenceType.Added,
                    null,
                    Format(langB),
                    ComparisonHelpers.DescribeStatus(DifferenceType.Added),
                    culture: code));
                continue;
            }

            if (langA is not null && langB is null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    Alias,
                    code,
                    langA.CultureName,
                    "Language",
                    path: null,
                    DifferenceType.Missing,
                    Format(langA),
                    null,
                    ComparisonHelpers.DescribeStatus(DifferenceType.Missing),
                    culture: code));
                continue;
            }

            var differences = new List<string>();
            if (!string.Equals(langA!.CultureName, langB!.CultureName, StringComparison.Ordinal))
            {
                differences.Add("name");
            }

            if (langA.IsDefault != langB.IsDefault)
            {
                differences.Add("default");
            }

            if (langA.IsMandatory != langB.IsMandatory)
            {
                differences.Add("mandatory");
            }

            var status = differences.Count == 0 ? DifferenceType.Identical : DifferenceType.Modified;
            items.Add(ComparisonHelpers.CreateItem(
                Alias,
                code,
                langA.CultureName,
                "Language",
                path: null,
                status,
                Format(langA),
                Format(langB),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}",
                culture: code));
        }

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, items.Count, "Settings comparison complete."));
        return ComparisonResult.FromItems(items);
    }

    private static string Format(LanguageSnapshot language)
        => $"{language.IsoCode} | {language.CultureName} | default={language.IsDefault} | mandatory={language.IsMandatory}";
}
