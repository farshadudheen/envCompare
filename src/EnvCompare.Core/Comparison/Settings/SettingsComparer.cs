using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Settings;

/// <summary>
/// Compares languages, document types, media types, and data types between environments.
/// </summary>
public sealed class SettingsComparer : IComparerModule
{
    private const string ModuleAlias = "settings";

    /// <inheritdoc />
    public string Alias => ModuleAlias;

    /// <inheritdoc />
    public string DisplayName => "Settings";

    /// <inheritdoc />
    public async Task<ComparisonResult> CompareAsync(
        ComparisonContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        var items = new List<ComparisonItem>();

        context.Progress?.Report(new ComparisonProgress(Alias, 0, null, "Loading languages…"));
        items.AddRange(await CompareLanguagesAsync(context, cancellationToken).ConfigureAwait(false));

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, null, "Loading document types…"));
        items.AddRange(await CompareDocumentTypesAsync(context, cancellationToken).ConfigureAwait(false));

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, null, "Loading media types…"));
        items.AddRange(await CompareMediaTypesAsync(context, cancellationToken).ConfigureAwait(false));

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, null, "Loading data types…"));
        items.AddRange(await CompareDataTypesAsync(context, cancellationToken).ConfigureAwait(false));

        context.Progress?.Report(new ComparisonProgress(Alias, items.Count, items.Count, "Settings comparison complete."));
        return ComparisonResult.FromItems(items);
    }

    private static async Task<IReadOnlyList<ComparisonItem>> CompareLanguagesAsync(
        ComparisonContext context,
        CancellationToken cancellationToken)
    {
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
                    ModuleAlias,
                    code,
                    langB.CultureName,
                    "Language",
                    path: null,
                    DifferenceType.Added,
                    null,
                    FormatLanguage(langB),
                    ComparisonHelpers.DescribeStatus(DifferenceType.Added),
                    culture: code));
                continue;
            }

            if (langA is not null && langB is null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    code,
                    langA.CultureName,
                    "Language",
                    path: null,
                    DifferenceType.Missing,
                    FormatLanguage(langA),
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
                ModuleAlias,
                code,
                langA.CultureName,
                "Language",
                path: null,
                status,
                FormatLanguage(langA),
                FormatLanguage(langB),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}",
                culture: code));
        }

        return items;
    }

    private static async Task<IReadOnlyList<ComparisonItem>> CompareDocumentTypesAsync(
        ComparisonContext context,
        CancellationToken cancellationToken)
    {
        var typesA = await context.EnvironmentA.GetDocumentTypesAsync(cancellationToken).ConfigureAwait(false);
        var typesB = await context.EnvironmentB.GetDocumentTypesAsync(cancellationToken).ConfigureAwait(false);
        return CompareContentTypes(
            typesA,
            typesB,
            context.EnvironmentA.Name,
            context.EnvironmentB.Name,
            context.Options,
            cancellationToken);
    }

    private static async Task<IReadOnlyList<ComparisonItem>> CompareMediaTypesAsync(
        ComparisonContext context,
        CancellationToken cancellationToken)
    {
        var typesA = await context.EnvironmentA.GetMediaTypesAsync(cancellationToken).ConfigureAwait(false);
        var typesB = await context.EnvironmentB.GetMediaTypesAsync(cancellationToken).ConfigureAwait(false);
        return CompareContentTypes(
            typesA,
            typesB,
            context.EnvironmentA.Name,
            context.EnvironmentB.Name,
            context.Options,
            cancellationToken,
            static type => "Media Type");
    }

    private static async Task<IReadOnlyList<ComparisonItem>> CompareDataTypesAsync(
        ComparisonContext context,
        CancellationToken cancellationToken)
    {
        var typesA = await context.EnvironmentA.GetDataTypesAsync(cancellationToken).ConfigureAwait(false);
        var typesB = await context.EnvironmentB.GetDataTypesAsync(cancellationToken).ConfigureAwait(false);

        var mapA = typesA.ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);
        var mapB = typesB.ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);
        var names = mapA.Keys.Union(mapB.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var items = new List<ComparisonItem>(names.Length);

        foreach (var name in names)
        {
            cancellationToken.ThrowIfCancellationRequested();
            mapA.TryGetValue(name, out var typeA);
            mapB.TryGetValue(name, out var typeB);

            if (typeA is null && typeB is not null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    name,
                    typeB.Name,
                    "Data Type",
                    path: typeB.EditorAlias,
                    DifferenceType.Added,
                    null,
                    DataTypeSnapshotComparer.Format(typeB),
                    ComparisonHelpers.DescribeOnlyInEnvironment(context.EnvironmentB.Name)));
                continue;
            }

            if (typeA is not null && typeB is null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    name,
                    typeA.Name,
                    "Data Type",
                    path: typeA.EditorAlias,
                    DifferenceType.Missing,
                    DataTypeSnapshotComparer.Format(typeA),
                    null,
                    ComparisonHelpers.DescribeOnlyInEnvironment(context.EnvironmentA.Name)));
                continue;
            }

            var differences = DataTypeSnapshotComparer.FindDifferences(typeA, typeB);
            var status = differences.Count == 0 ? DifferenceType.Identical : DifferenceType.Modified;
            items.Add(ComparisonHelpers.CreateItem(
                ModuleAlias,
                name,
                typeA!.Name,
                "Data Type",
                path: typeA.EditorAlias,
                status,
                DataTypeSnapshotComparer.Format(typeA),
                DataTypeSnapshotComparer.Format(typeB),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}"));
        }

        return items;
    }

    private static IReadOnlyList<ComparisonItem> CompareContentTypes(
        IReadOnlyList<ContentTypeSnapshot> typesA,
        IReadOnlyList<ContentTypeSnapshot> typesB,
        string environmentAName,
        string environmentBName,
        EnvCompareOptions options,
        CancellationToken cancellationToken,
        Func<ContentTypeSnapshot, string>? labelFactory = null)
    {
        labelFactory ??= static type => type.IsElement ? "Element Type" : "Document Type";

        var mapA = typesA.ToDictionary(t => t.Alias, StringComparer.OrdinalIgnoreCase);
        var mapB = typesB.ToDictionary(t => t.Alias, StringComparer.OrdinalIgnoreCase);
        var aliases = mapA.Keys.Union(mapB.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
        var items = new List<ComparisonItem>(aliases.Length);

        foreach (var alias in aliases)
        {
            cancellationToken.ThrowIfCancellationRequested();
            mapA.TryGetValue(alias, out var typeA);
            mapB.TryGetValue(alias, out var typeB);

            if (ComparisonHelpers.IsIgnoredContentType(alias, options))
            {
                continue;
            }

            if (typeA is null && typeB is not null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    alias,
                    typeB.Name,
                    labelFactory(typeB),
                    path: null,
                    DifferenceType.Added,
                    null,
                    ContentTypeSnapshotComparer.Format(typeB),
                    ComparisonHelpers.DescribeOnlyInEnvironment(environmentBName)));
                continue;
            }

            if (typeA is not null && typeB is null)
            {
                items.Add(ComparisonHelpers.CreateItem(
                    ModuleAlias,
                    alias,
                    typeA.Name,
                    labelFactory(typeA),
                    path: null,
                    DifferenceType.Missing,
                    ContentTypeSnapshotComparer.Format(typeA),
                    null,
                    ComparisonHelpers.DescribeOnlyInEnvironment(environmentAName)));
                continue;
            }

            var differences = ContentTypeSnapshotComparer.FindDifferences(typeA, typeB);
            var status = differences.Count == 0 ? DifferenceType.Identical : DifferenceType.Modified;
            items.Add(ComparisonHelpers.CreateItem(
                ModuleAlias,
                alias,
                typeA!.Name,
                labelFactory(typeA),
                path: null,
                status,
                ContentTypeSnapshotComparer.Format(typeA),
                ContentTypeSnapshotComparer.Format(typeB),
                status == DifferenceType.Identical
                    ? ComparisonHelpers.DescribeStatus(status)
                    : $"Changed: {string.Join(", ", differences)}"));
        }

        return items;
    }

    private static string FormatLanguage(LanguageSnapshot language)
        => $"{language.IsoCode} | {language.CultureName} | default={language.IsDefault} | mandatory={language.IsMandatory}";
}
