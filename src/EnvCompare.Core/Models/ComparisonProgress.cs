namespace EnvCompare.Core.Models;

/// <summary>
/// Progress snapshot for background comparison reporting.
/// </summary>
/// <param name="ModuleAlias">Module currently running.</param>
/// <param name="Processed">Items processed so far.</param>
/// <param name="Total">Estimated total items, if known.</param>
/// <param name="Message">Optional status message.</param>
public sealed record ComparisonProgress(
    string ModuleAlias,
    int Processed,
    int? Total,
    string? Message);
