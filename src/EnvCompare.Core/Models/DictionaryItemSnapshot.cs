namespace EnvCompare.Core.Models;

/// <summary>
/// A single culture translation on a dictionary item.
/// </summary>
/// <param name="Culture">ISO culture code.</param>
/// <param name="Value">Translated value.</param>
public sealed record DictionaryTranslationSnapshot(
    string Culture,
    string? Value);

/// <summary>
/// Environment-agnostic dictionary item snapshot for comparison.
/// </summary>
/// <param name="Key">Unique dictionary item key.</param>
/// <param name="ItemKey">Dictionary item key path (e.g. section.item).</param>
/// <param name="ParentKey">Parent dictionary item key; null for roots.</param>
/// <param name="Translations">Translations per culture.</param>
public sealed record DictionaryItemSnapshot(
    Guid Key,
    string ItemKey,
    Guid? ParentKey,
    IReadOnlyList<DictionaryTranslationSnapshot> Translations);
