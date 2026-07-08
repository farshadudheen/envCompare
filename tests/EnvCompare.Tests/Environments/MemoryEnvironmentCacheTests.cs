using EnvCompare.Core.Caching;
using EnvCompare.Infrastructure.Caching;
using Microsoft.Extensions.Caching.Memory;

namespace EnvCompare.Tests.Environments;

public sealed class MemoryEnvironmentCacheTests
{
    [Fact]
    public async Task GetOrCreateAsync_CachesValue()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        IEnvironmentCache cache = new MemoryEnvironmentCache(memoryCache);
        var calls = 0;

        var first = await cache.GetOrCreateAsync(
            "key",
            _ =>
            {
                calls++;
                return Task.FromResult(42);
            });

        var second = await cache.GetOrCreateAsync(
            "key",
            _ =>
            {
                calls++;
                return Task.FromResult(99);
            });

        Assert.Equal(42, first);
        Assert.Equal(42, second);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task Remove_ForcesFactoryToRunAgain()
    {
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        IEnvironmentCache cache = new MemoryEnvironmentCache(memoryCache);
        var calls = 0;

        await cache.GetOrCreateAsync("key", _ =>
        {
            calls++;
            return Task.FromResult("a");
        });

        cache.Remove("key");

        var value = await cache.GetOrCreateAsync("key", _ =>
        {
            calls++;
            return Task.FromResult("b");
        });

        Assert.Equal("b", value);
        Assert.Equal(2, calls);
    }
}
