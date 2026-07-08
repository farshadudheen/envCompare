using EnvCompare.Core.Models;

namespace EnvCompare.Core.Abstractions;

/// <summary>
/// Pluggable comparison module (content, media, settings, dictionary, or future Members).
/// </summary>
public interface IComparerModule
{
    /// <summary>
    /// Gets a stable module alias used for registration and UI tabs.
    /// </summary>
    string Alias { get; }

    /// <summary>
    /// Gets a human-readable display name.
    /// </summary>
    string DisplayName { get; }

    /// <summary>
    /// Executes the module comparison between two environments.
    /// </summary>
    /// <param name="context">Shared comparison context including providers and options.</param>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    Task<ComparisonResult> CompareAsync(ComparisonContext context, CancellationToken cancellationToken = default);
}
