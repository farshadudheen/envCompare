namespace EnvCompare.Core.Models;

/// <summary>
/// Request describing which environments and modules to compare.
/// </summary>
/// <param name="EnvironmentA">Provider name or alias for environment A.</param>
/// <param name="EnvironmentB">Provider name or alias for environment B.</param>
/// <param name="ModuleAliases">Optional module filter; null/empty runs all registered modules.</param>
/// <param name="Culture">Optional culture filter applied after comparison.</param>
/// <param name="ContentType">Optional content/media type alias filter.</param>
/// <param name="PathContains">Optional path substring filter.</param>
/// <param name="Status">Optional status filter.</param>
/// <param name="Search">Optional keyword filter over name/path/id.</param>
public sealed record ComparisonRequest(
    string EnvironmentA,
    string EnvironmentB,
    IReadOnlyList<string>? ModuleAliases = null,
    string? Culture = null,
    string? ContentType = null,
    string? PathContains = null,
    DifferenceType? Status = null,
    string? Search = null);
