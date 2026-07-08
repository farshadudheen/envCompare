using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Tests.Environments;

public sealed class EnvironmentProviderRegistryTests
{
    [Fact]
    public void GetByName_IsCaseInsensitive()
    {
        var local = new FakeProvider("Local", isLocal: true);
        var remote = new FakeProvider("Development", isLocal: false);
        var registry = new TestRegistry([local, remote]);

        Assert.Same(local, registry.GetByName("local"));
        Assert.Same(remote, registry.GetByName("DEVELOPMENT"));
        Assert.Null(registry.GetByName("production"));
    }

    [Fact]
    public void TryGet_ReturnsFalse_WhenMissing()
    {
        var registry = new TestRegistry([new FakeProvider("Local", isLocal: true)]);

        Assert.False(registry.TryGet("Staging", out var provider));
        Assert.Null(provider);
    }

    private sealed class FakeProvider(string name, bool isLocal) : IEnvironmentProvider
    {
        public string Name { get; } = name;
        public bool IsLocal { get; } = isLocal;

        public Task<EnvironmentDescriptor> GetDescriptorAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new EnvironmentDescriptor(Name, Name, null, IsLocal));

        public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
            TreeQuery query,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new EnvironmentPagedResult<ContentNodeSnapshot>([], 0, 0, 50));

        public Task<ContentNodeSnapshot?> GetContentByKeyAsync(
            Guid key,
            CancellationToken cancellationToken = default)
            => Task.FromResult<ContentNodeSnapshot?>(null);

        public Task<EnvironmentPagedResult<MediaNodeSnapshot>> GetMediaAsync(
            TreeQuery query,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new EnvironmentPagedResult<MediaNodeSnapshot>([], 0, 0, 50));

        public Task<MediaNodeSnapshot?> GetMediaByKeyAsync(
            Guid key,
            CancellationToken cancellationToken = default)
            => Task.FromResult<MediaNodeSnapshot?>(null);

        public Task<IReadOnlyList<LanguageSnapshot>> GetLanguagesAsync(
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<LanguageSnapshot>>([]);
    }

    private sealed class TestRegistry(IReadOnlyList<IEnvironmentProvider> providers) : IEnvironmentProviderRegistry
    {
        private readonly Dictionary<string, IEnvironmentProvider> _map =
            providers.ToDictionary(p => p.Name, StringComparer.OrdinalIgnoreCase);

        public IReadOnlyList<IEnvironmentProvider> GetAll() => providers;

        public IEnvironmentProvider? GetByName(string name)
            => string.IsNullOrWhiteSpace(name)
                ? null
                : _map.TryGetValue(name.Trim(), out var provider) ? provider : null;

        public bool TryGet(string name, out IEnvironmentProvider? provider)
        {
            provider = GetByName(name);
            return provider is not null;
        }
    }
}
