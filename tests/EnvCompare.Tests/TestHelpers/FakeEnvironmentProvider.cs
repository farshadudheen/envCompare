using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Tests.TestHelpers;

/// <summary>
/// Configurable in-memory environment provider for comparison tests.
/// </summary>
internal class FakeEnvironmentProvider : IEnvironmentProvider
{
    public FakeEnvironmentProvider(
        string name,
        IReadOnlyList<ContentNodeSnapshot>? content = null,
        IReadOnlyList<MediaNodeSnapshot>? media = null,
        IReadOnlyList<LanguageSnapshot>? languages = null,
        bool isLocal = true,
        bool isAvailable = true)
    {
        Name = name;
        IsLocal = isLocal;
        IsAvailable = isAvailable;
        Content = content ?? [];
        Media = media ?? [];
        Languages = languages ?? [];
    }

    public string Name { get; }

    public bool IsLocal { get; }

    public bool IsAvailable { get; }

    public IReadOnlyList<ContentNodeSnapshot> Content { get; }

    public IReadOnlyList<MediaNodeSnapshot> Media { get; }

    public IReadOnlyList<LanguageSnapshot> Languages { get; }

    public Task<EnvironmentDescriptor> GetDescriptorAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(new EnvironmentDescriptor(Name, Name, null, IsLocal));

    public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(IsAvailable);

    public virtual Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default)
    {
        var filtered = Content
            .Where(c => c.ParentKey == query.ParentKey)
            .Skip(query.Skip)
            .Take(query.Take)
            .ToArray();
        var total = Content.Count(c => c.ParentKey == query.ParentKey);
        return Task.FromResult(new EnvironmentPagedResult<ContentNodeSnapshot>(filtered, total, query.Skip, query.Take));
    }

    public Task<ContentNodeSnapshot?> GetContentByKeyAsync(Guid key, CancellationToken cancellationToken = default)
        => Task.FromResult(Content.FirstOrDefault(c => c.Key == key));

    public Task<EnvironmentPagedResult<MediaNodeSnapshot>> GetMediaAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default)
    {
        var filtered = Media
            .Where(m => m.ParentKey == query.ParentKey)
            .Skip(query.Skip)
            .Take(query.Take)
            .ToArray();
        var total = Media.Count(m => m.ParentKey == query.ParentKey);
        return Task.FromResult(new EnvironmentPagedResult<MediaNodeSnapshot>(filtered, total, query.Skip, query.Take));
    }

    public Task<MediaNodeSnapshot?> GetMediaByKeyAsync(Guid key, CancellationToken cancellationToken = default)
        => Task.FromResult(Media.FirstOrDefault(m => m.Key == key));

    public Task<IReadOnlyList<LanguageSnapshot>> GetLanguagesAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(Languages);
}

/// <summary>
/// Minimal registry backed by explicit providers.
/// </summary>
internal sealed class FakeEnvironmentProviderRegistry : IEnvironmentProviderRegistry
{
    private readonly Dictionary<string, IEnvironmentProvider> _map;

    public FakeEnvironmentProviderRegistry(params IEnvironmentProvider[] providers)
    {
        _map = providers.ToDictionary(p => p.Name, StringComparer.OrdinalIgnoreCase);
    }

    public IReadOnlyList<IEnvironmentProvider> GetAll() => _map.Values.ToArray();

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

/// <summary>
/// Snapshot builders to keep test data concise.
/// </summary>
internal static class SnapshotBuilder
{
    public static ContentNodeSnapshot Content(
        Guid key,
        string name,
        string type,
        Guid? parent = null,
        int sort = 0,
        int level = 1,
        bool published = true,
        params string[] cultures)
        => new(
            key,
            1,
            name,
            type,
            parent,
            parent is null ? $"-1,{key:N}" : $"-1,{parent:N},{key:N}",
            level,
            sort,
            published,
            cultures.Length > 0 ? cultures : []);

    public static MediaNodeSnapshot Media(
        Guid key,
        string name,
        string type,
        Guid? parent = null,
        int sort = 0,
        string? fileName = null)
        => new(
            key,
            1,
            name,
            type,
            parent,
            parent is null ? $"-1,{key:N}" : $"-1,{parent:N},{key:N}",
            parent is null ? 1 : 2,
            sort,
            fileName);

    public static LanguageSnapshot Language(
        string iso,
        string name,
        bool isDefault = false,
        bool isMandatory = false)
        => new(iso, name, isDefault, isMandatory);
}
