using Asp.Versioning;
using EnvCompare.Backoffice.Authorization;
using EnvCompare.Backoffice.DependencyInjection;
using EnvCompare.Infrastructure.Migrations;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

namespace EnvCompare.Backoffice.Composers;

/// <summary>
/// Composes EnvCompare DI and OpenAPI document registration.
/// </summary>
public sealed class EnvCompareComposer : IComposer
{
    /// <inheritdoc />
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddEnvCompare();
        builder.PackageMigrationPlans().Add<EnvCompareMigrationPlan>();

        builder.Services.AddSingleton<EnvComparePeerApiKeyFilter>();

        builder.Services.AddSingleton<IOperationIdHandler, EnvCompareOperationIdHandler>();

        builder.Services.Configure<SwaggerGenOptions>(opt =>
        {
            opt.SwaggerDoc(Constants.ApiName, new OpenApiInfo
            {
                Title = "EnvCompare Backoffice API",
                Version = "1.0"
            });

            opt.OperationFilter<EnvCompareOperationSecurityFilter>();
        });
    }

    private sealed class EnvCompareOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => Constants.ApiName;
    }

    private sealed class EnvCompareOperationIdHandler : OperationIdHandler
    {
        public EnvCompareOperationIdHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
            : base(apiVersioningOptions)
        {
        }

        protected override bool CanHandle(ApiDescription apiDescription, ControllerActionDescriptor controllerActionDescriptor)
        {
            return controllerActionDescriptor.ControllerTypeInfo.Namespace?
                .StartsWith("EnvCompare.Backoffice.Controllers", StringComparison.InvariantCultureIgnoreCase) is true;
        }

        public override string Handle(ApiDescription apiDescription)
            => $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
    }
}
