using EnvCompare.Backoffice.Controllers;
using EnvCompare.Core.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Web.Common.ApplicationBuilder;

namespace EnvCompare.Backoffice.Composers;

/// <summary>
/// Maps peer API routes with <c>ShortCircuit()</c> so Umbraco Cloud Basic Auth does not intercept them.
/// </summary>
public sealed class EnvComparePeerApiPipelineComposer : IComposer
{
    /// <inheritdoc />
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<UmbracoPipelineOptions>(options =>
        {
            options.AddFilter(new UmbracoPipelineFilter(
                "EnvCompare.PeerApi",
                endpoints: app =>
                {
                    app.UseEndpoints(endpoints =>
                    {
                        MapPeerApiRoutes(endpoints);
                    });
                }));
        });
    }

    private static void MapPeerApiRoutes(IEndpointRouteBuilder endpoints)
    {
        const string controller = "EnvComparePeerApi";

        Map(endpoints, controller, "ping", nameof(EnvComparePeerApiController.Ping));
        Map(endpoints, controller, "health", nameof(EnvComparePeerApiController.Health));
        Map(endpoints, controller, "content", nameof(EnvComparePeerApiController.GetContent));
        Map(endpoints, controller, "content/{key:guid}", nameof(EnvComparePeerApiController.GetContentByKey));
        Map(endpoints, controller, "media", nameof(EnvComparePeerApiController.GetMedia));
        Map(endpoints, controller, "media/{key:guid}", nameof(EnvComparePeerApiController.GetMediaByKey));
        Map(endpoints, controller, "languages", nameof(EnvComparePeerApiController.GetLanguages));
        Map(endpoints, controller, "document-types", nameof(EnvComparePeerApiController.GetDocumentTypes));
        Map(endpoints, controller, "media-types", nameof(EnvComparePeerApiController.GetMediaTypes));
        Map(endpoints, controller, "data-types", nameof(EnvComparePeerApiController.GetDataTypes));
        Map(endpoints, controller, "dictionary-items", nameof(EnvComparePeerApiController.GetDictionaryItems));
    }

    private static void Map(
        IEndpointRouteBuilder endpoints,
        string controller,
        string pattern,
        string action)
    {
        endpoints
            .MapControllerRoute(
                name: $"EnvCompare.PeerApi.{action}",
                pattern: $"{EnvComparePeerApiRoutes.Prefix}/{pattern}",
                defaults: new { controller, action })
            .ShortCircuit();
    }
}
