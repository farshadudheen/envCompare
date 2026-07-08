using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison.Dictionary;

/// <summary>
/// Dictionary comparison module.
/// Full dictionary item providers arrive later; this module currently reports an empty comparable set
/// so the engine/UI tab is wired without blocking Content/Media/Settings.
/// </summary>
public sealed class DictionaryComparer : IComparerModule
{
    /// <inheritdoc />
    public string Alias => "dictionary";

    /// <inheritdoc />
    public string DisplayName => "Dictionary";

    /// <inheritdoc />
    public Task<ComparisonResult> CompareAsync(
        ComparisonContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        context.Progress?.Report(new ComparisonProgress(
            Alias,
            0,
            0,
            "Dictionary provider not yet implemented — returning empty result."));

        return Task.FromResult(ComparisonResult.Empty);
    }
}
