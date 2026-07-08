using EnvCompare.Core.Models;

namespace EnvCompare.Core.Abstractions;

/// <summary>
/// Orchestrates registered <see cref="IComparerModule"/> implementations.
/// </summary>
public interface IComparisonEngine
{
    /// <summary>
    /// Runs one or more comparer modules against the supplied environments.
    /// </summary>
    /// <param name="request">Comparison request describing environments and filters.</param>
    /// <param name="progress">Optional progress reporter for background comparison.</param>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    Task<ComparisonResult> CompareAsync(
        ComparisonRequest request,
        IProgress<ComparisonProgress>? progress = null,
        CancellationToken cancellationToken = default);
}
