namespace EnvCompare.Core.Models;

/// <summary>
/// Environment-agnostic data type snapshot for comparison.
/// </summary>
/// <param name="Key">Unique data type key.</param>
/// <param name="Name">Display name (join key across environments).</param>
/// <param name="EditorAlias">Property editor alias.</param>
/// <param name="EditorUiAlias">Backoffice UI editor alias when set.</param>
/// <param name="DatabaseType">Underlying value storage type.</param>
/// <param name="ConfigurationJson">Normalized JSON of editor configuration.</param>
public sealed record DataTypeSnapshot(
    Guid Key,
    string Name,
    string EditorAlias,
    string? EditorUiAlias,
    string DatabaseType,
    string ConfigurationJson);
