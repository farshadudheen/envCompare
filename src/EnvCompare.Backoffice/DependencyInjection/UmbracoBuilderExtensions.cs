using EnvCompare.Infrastructure.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;

namespace EnvCompare.Backoffice.DependencyInjection;

/// <summary>
/// Umbraco composition entry points for the EnvCompare package.
/// </summary>
public static class UmbracoBuilderExtensions
{
    /// <summary>
    /// Registers EnvCompare services with the Umbraco builder.
    /// </summary>
    /// <param name="builder">Umbraco builder.</param>
    /// <returns>The same builder for chaining.</returns>
    public static IUmbracoBuilder AddEnvCompare(this IUmbracoBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Services.AddEnvCompareInfrastructure();

        return builder;
    }
}
