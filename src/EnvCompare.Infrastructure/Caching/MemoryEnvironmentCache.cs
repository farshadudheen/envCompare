using EnvCompare.Core.Caching;
using Microsoft.Extensions.Caching.Memory;

namespace EnvCompare.Infrastructure.Caching;

/// <summary>
/// Memory-backed implementation of <see cref="IEnvironmentCache"/>.
/// </summary>
public sealed class MemoryEnvironmentCache : IEnvironmentCache
{
    private const string Prefix = "EnvCompare:";
    private readonly IMemoryCache _cache;
    private readonly HashSet<string> _keys = new(StringComparer.Ordinal);
    private readonly object _gate = new();

    /// <summary>
    /// Creates a new cache wrapper.
    /// </summary>
    public MemoryEnvironmentCache(IMemoryCache cache)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
    }

    /// <inheritdoc />
    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? absoluteExpiration = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(factory);

        var cacheKey = Prefix + key;
        if (_cache.TryGetValue(cacheKey, out T? existing) && existing is not null)
        {
            return existing;
        }

        var value = await factory(cancellationToken).ConfigureAwait(false);
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absoluteExpiration ?? TimeSpan.FromMinutes(2)
        };

        _cache.Set(cacheKey, value, options);
        lock (_gate)
        {
            _keys.Add(cacheKey);
        }

        return value;
    }

    /// <inheritdoc />
    public void Remove(string key)
    {
        var cacheKey = Prefix + key;
        _cache.Remove(cacheKey);
        lock (_gate)
        {
            _keys.Remove(cacheKey);
        }
    }

    /// <inheritdoc />
    public void Clear()
    {
        lock (_gate)
        {
            foreach (var key in _keys)
            {
                _cache.Remove(key);
            }

            _keys.Clear();
        }
    }
}
