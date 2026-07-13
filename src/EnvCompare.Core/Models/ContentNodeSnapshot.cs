namespace EnvCompare.Core.Models;

/// <summary>
/// Environment-agnostic content node snapshot for comparison.
/// </summary>
/// <param name="Key">Unique content key.</param>
/// <param name="Id">Legacy integer id when available.</param>
/// <param name="Name">Node name (invariant or requested culture).</param>
/// <param name="ContentTypeAlias">Document type alias.</param>
/// <param name="ParentKey">Parent key; null for roots.</param>
/// <param name="Path">Umbraco path string.</param>
/// <param name="Level">Tree level.</param>
/// <param name="SortOrder">Sort order among siblings.</param>
/// <param name="Published">Whether published in at least one culture.</param>
/// <param name="Cultures">Available culture codes.</param>
/// <param name="Properties">Property values on the node.</param>
public sealed record ContentNodeSnapshot(
    Guid Key,
    int Id,
    string Name,
    string ContentTypeAlias,
    Guid? ParentKey,
    string Path,
    int Level,
    int SortOrder,
    bool Published,
    IReadOnlyList<string> Cultures,
    IReadOnlyList<PropertyValueSnapshot> Properties);
