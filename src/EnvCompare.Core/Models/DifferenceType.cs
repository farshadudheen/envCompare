namespace EnvCompare.Core.Models;

/// <summary>
/// Status of a compared item relative to environment A vs B.
/// </summary>
public enum DifferenceType
{
    /// <summary>Item exists in both environments with matching values.</summary>
    Identical = 0,

    /// <summary>Item exists only in environment B (added relative to A).</summary>
    Added = 1,

    /// <summary>Item exists only in environment A (missing in B).</summary>
    Missing = 2,

    /// <summary>Item exists in both environments but values differ.</summary>
    Modified = 3,

    /// <summary>Item was excluded by configuration or filters.</summary>
    Ignored = 4
}
