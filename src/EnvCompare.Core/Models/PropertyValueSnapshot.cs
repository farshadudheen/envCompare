namespace EnvCompare.Core.Models;

/// <summary>
/// A single property value on a content or media node.
/// </summary>
/// <param name="Alias">Property type alias.</param>
/// <param name="Culture">Culture code when the property varies by culture; otherwise null.</param>
/// <param name="Value">Normalized serialized value for comparison.</param>
public sealed record PropertyValueSnapshot(
    string Alias,
    string? Culture,
    string? Value);
