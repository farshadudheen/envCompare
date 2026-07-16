using EnvCompare.Backoffice.Authorization;
using EnvCompare.Backoffice.DependencyInjection;
using EnvCompare.Infrastructure.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

namespace EnvCompare.Backoffice.Composers;

/// <summary>
/// Composes EnvCompare DI and package migrations.
/// </summary>
public sealed class EnvCompareComposer : IComposer
{
    /// <inheritdoc />
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddEnvCompare();
        builder.PackageMigrationPlans().Add<EnvCompareMigrationPlan>();

        builder.Services.AddSingleton<EnvComparePeerApiKeyFilter>();
    }
}
