namespace EnvCompare.Core.Abstractions;

/// <summary>
/// Resolves configured <see cref="IEnvironmentProvider"/> instances by name.
/// </summary>
public interface IEnvironmentProviderRegistry
{
    /// <summary>
    /// Gets all registered environment providers (local first, then remotes).
    /// </summary>
    IReadOnlyList<IEnvironmentProvider> GetAll();

    /// <summary>
    /// Gets a provider by logical name (case-insensitive).
    /// </summary>
    /// <param name="name">Environment name.</param>
    /// <returns>Provider or null when not found.</returns>
    IEnvironmentProvider? GetByName(string name);

    /// <summary>
    /// Tries to get a provider by logical name.
    /// </summary>
    bool TryGet(string name, out IEnvironmentProvider? provider);
}
