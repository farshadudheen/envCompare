using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Caching;
using EnvCompare.Core.Comparison;
using EnvCompare.Core.Comparison.Content;
using EnvCompare.Core.Comparison.Dictionary;
using EnvCompare.Core.Comparison.Media;
using EnvCompare.Core.Comparison.Settings;
using EnvCompare.Core.Configuration;
using EnvCompare.Infrastructure.Caching;
using EnvCompare.Infrastructure.Environments;
using Microsoft.Extensions.DependencyInjection;

namespace EnvCompare.Infrastructure.DependencyInjection;

/// <summary>
/// Registers Infrastructure services for EnvCompare.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds EnvCompare infrastructure (options, cache, environment providers, comparison engine).
    /// </summary>
    /// <param name="services">Service collection.</param>
    /// <returns>The same service collection for chaining.</returns>
    public static IServiceCollection AddEnvCompareInfrastructure(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddOptions<EnvCompareOptions>()
            .BindConfiguration(EnvCompareOptions.SectionName);

        services.AddMemoryCache();
        services.AddHttpClient("EnvCompare.Remote");

        services.AddSingleton<IEnvironmentCache, MemoryEnvironmentCache>();
        services.AddSingleton<LocalEnvironmentProvider>();
        services.AddSingleton<IRemoteEnvironmentProviderFactory, RemoteEnvironmentProviderFactory>();
        services.AddSingleton<IEnvironmentProviderRegistry, EnvironmentProviderRegistry>();
        services.AddSingleton<IEnvironmentProvider>(sp => sp.GetRequiredService<LocalEnvironmentProvider>());

        services.AddSingleton<IComparerModule, ContentComparer>();
        services.AddSingleton<IComparerModule, MediaComparer>();
        services.AddSingleton<IComparerModule, SettingsComparer>();
        services.AddSingleton<IComparerModule, DictionaryComparer>();
        services.AddSingleton<IComparisonEngine, ComparisonEngine>();

        return services;
    }
}
