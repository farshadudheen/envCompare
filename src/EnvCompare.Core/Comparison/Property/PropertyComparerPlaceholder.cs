using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Property;

/// <summary>
/// Property-value comparison placeholder.
/// Tree-level structural diffs live in <c>ContentComparer</c>; deep property/HTML/block diffs arrive in Step 6.
/// </summary>
public sealed class PropertyComparerPlaceholder
{
    /// <summary>
    /// Reserved alias for future property module registration.
    /// </summary>
    public const string Alias = "properties";
}
