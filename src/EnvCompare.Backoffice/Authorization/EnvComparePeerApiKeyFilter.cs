using EnvCompare.Core.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace EnvCompare.Backoffice.Authorization;

/// <summary>
/// Optional shared-secret guard for the server-to-server peer API.
/// When <see cref="EnvCompareOptions.PeerApiKey"/> is set, callers must send
/// <c>Authorization: Bearer {key}</c> (configure the same value in the remote
/// environment's <c>Authentication</c> setting).
/// </summary>
public sealed class EnvComparePeerApiKeyFilter : IAsyncAuthorizationFilter
{
    private readonly IOptionsMonitor<EnvCompareOptions> _options;

    /// <summary>
    /// Creates the filter.
    /// </summary>
    public EnvComparePeerApiKeyFilter(IOptionsMonitor<EnvCompareOptions> options)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
    }

    /// <inheritdoc />
    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var configuredKey = _options.CurrentValue.PeerApiKey;
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return Task.CompletedTask;
        }

        var authHeader = context.HttpContext.Request.Headers.Authorization.ToString();
        if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            context.Result = new UnauthorizedObjectResult(
                "EnvCompare peer API requires Authorization: Bearer {PeerApiKey}.");
            return Task.CompletedTask;
        }

        var token = authHeader["Bearer ".Length..].Trim();
        if (!string.Equals(token, configuredKey, StringComparison.Ordinal))
        {
            context.Result = new UnauthorizedObjectResult("Invalid EnvCompare peer API key.");
        }

        return Task.CompletedTask;
    }
}
