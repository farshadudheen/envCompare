namespace EnvCompare.Core.Models;

/// <summary>
/// Environment-agnostic document or media type snapshot for comparison.
/// </summary>
/// <param name="Key">Unique type key.</param>
/// <param name="Alias">Type alias.</param>
/// <param name="Name">Display name.</param>
/// <param name="Icon">Backoffice icon when available.</param>
/// <param name="IsElement">Whether this is an element type.</param>
/// <param name="Compositions">Aliases of composed types.</param>
/// <param name="Properties">Property type definitions on this type.</param>
public sealed record ContentTypeSnapshot(
    Guid Key,
    string Alias,
    string Name,
    string? Icon,
    bool IsElement,
    IReadOnlyList<string> Compositions,
    IReadOnlyList<ContentTypePropertySnapshot> Properties);

/// <summary>
/// A property type definition on a document or media type.
/// </summary>
/// <param name="Alias">Property alias.</param>
/// <param name="Name">Display name.</param>
/// <param name="DataTypeKey">Data type key.</param>
/// <param name="Mandatory">Whether the property is mandatory.</param>
/// <param name="SortOrder">Sort order in the editor.</param>
/// <param name="Variations">Variation flags serialized as a string.</param>
public sealed record ContentTypePropertySnapshot(
    string Alias,
    string Name,
    string DataTypeKey,
    bool Mandatory,
    int SortOrder,
    string Variations);
