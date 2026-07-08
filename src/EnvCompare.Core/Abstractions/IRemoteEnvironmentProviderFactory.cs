namespace EnvCompare.Core.Abstractions;

/// <summary>
/// Creates remote environment providers from configuration.
/// </summary>
public interface IRemoteEnvironmentProviderFactory
{
    /// <summary>
    /// Creates providers for all configured remote environments.
    /// </summary>
    IReadOnlyList<IEnvironmentProvider> CreateConfiguredRemotes();
}
