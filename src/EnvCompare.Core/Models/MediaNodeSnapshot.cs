namespace EnvCompare.Core.Models;

/// <summary>
/// Environment-agnostic media node snapshot for comparison.
/// </summary>
/// <param name="Key">Unique media key.</param>
/// <param name="Id">Legacy integer id when available.</param>
/// <param name="Name">Media name.</param>
/// <param name="MediaTypeAlias">Media type alias.</param>
/// <param name="ParentKey">Parent key; null for roots.</param>
/// <param name="Path">Umbraco path string.</param>
/// <param name="Level">Tree level.</param>
/// <param name="SortOrder">Sort order among siblings.</param>
/// <param name="FileName">Primary file name when applicable.</param>
/// <param name="Properties">Property values on the node.</param>
public sealed record MediaNodeSnapshot(
    Guid Key,
    int Id,
    string Name,
    string MediaTypeAlias,
    Guid? ParentKey,
    string Path,
    int Level,
    int SortOrder,
    string? FileName,
    IReadOnlyList<PropertyValueSnapshot> Properties);
