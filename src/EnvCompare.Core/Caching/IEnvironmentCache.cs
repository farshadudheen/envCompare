namespace EnvCompare.Core.Caching;

/// <summary>
/// Thin cache abstraction for repeated environment reads.
/// </summary>
public interface IEnvironmentCache
{
    /// <summary>
    /// Gets a cached value or creates it.
    /// </summary>
    Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? absoluteExpiration = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a cache entry.
    /// </summary>
    void Remove(string key);

    /// <summary>
    /// Clears all EnvCompare cache entries.
    /// </summary>
    void Clear();
}
