namespace EnvCompare.Core.Models;

/// <summary>
/// A single compared row shown in the dashboard results grid.
/// </summary>
/// <param name="Id">Stable identifier for the item (node key, media key, etc.).</param>
/// <param name="Name">Display name.</param>
/// <param name="ContentType">Document type, media type, or settings kind.</param>
/// <param name="Path">Hierarchy path when applicable.</param>
/// <param name="Culture">Culture code when variation applies.</param>
/// <param name="Segment">Segment when variation applies.</param>
/// <param name="Status">Comparison status.</param>
/// <param name="EnvironmentAValue">Serialized or display value from environment A.</param>
/// <param name="EnvironmentBValue">Serialized or display value from environment B.</param>
/// <param name="DifferenceSummary">Short human-readable difference description.</param>
/// <param name="ModuleAlias">Comparer module that produced this row.</param>
public sealed record ComparisonItem(
    string Id,
    string Name,
    string? ContentType,
    string? Path,
    string? Culture,
    string? Segment,
    DifferenceType Status,
    string? EnvironmentAValue,
    string? EnvironmentBValue,
    string? DifferenceSummary,
    string? ModuleAlias = null);
