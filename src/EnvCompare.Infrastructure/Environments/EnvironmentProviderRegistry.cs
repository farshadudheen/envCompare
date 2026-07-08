using EnvCompare.Core.Abstractions;

namespace EnvCompare.Infrastructure.Environments;

/// <summary>
/// Registry of local + configured remote environment providers.
/// </summary>
public sealed class EnvironmentProviderRegistry : IEnvironmentProviderRegistry
{
    private readonly IReadOnlyList<IEnvironmentProvider> _providers;
    private readonly Dictionary<string, IEnvironmentProvider> _byName;

    /// <summary>
    /// Creates a registry from a local provider and optional remotes.
    /// </summary>
    public EnvironmentProviderRegistry(
        LocalEnvironmentProvider localProvider,
        IRemoteEnvironmentProviderFactory remoteFactory)
    {
        ArgumentNullException.ThrowIfNull(localProvider);
        ArgumentNullException.ThrowIfNull(remoteFactory);

        var remotes = remoteFactory.CreateConfiguredRemotes();
        var list = new List<IEnvironmentProvider>(1 + remotes.Count) { localProvider };
        list.AddRange(remotes);

        _providers = list;
        _byName = list.ToDictionary(p => p.Name, StringComparer.OrdinalIgnoreCase);
    }

    /// <inheritdoc />
    public IReadOnlyList<IEnvironmentProvider> GetAll() => _providers;

    /// <inheritdoc />
    public IEnvironmentProvider? GetByName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        return _byName.TryGetValue(name.Trim(), out var provider) ? provider : null;
    }

    /// <inheritdoc />
    public bool TryGet(string name, out IEnvironmentProvider? provider)
    {
        provider = GetByName(name);
        return provider is not null;
    }
}
