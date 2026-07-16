using EnvCompare.Backoffice.Models;
using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace EnvCompare.Backoffice.Controllers;

/// <summary>
/// Backoffice JSON API for the EnvCompare dashboard (Umbraco 13 AngularJS).
/// Routes under <c>/umbraco/backoffice/EnvCompare/EnvCompareApi/...</c>.
/// </summary>
[PluginController("EnvCompare")]
[Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
public sealed class EnvCompareApiController : UmbracoAuthorizedJsonController
{
    private readonly IEnvironmentProviderRegistry _registry;
    private readonly IComparisonEngine _comparisonEngine;

    /// <summary>
    /// Creates the controller.
    /// </summary>
    public EnvCompareApiController(
        IEnvironmentProviderRegistry registry,
        IComparisonEngine comparisonEngine)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        _comparisonEngine = comparisonEngine ?? throw new ArgumentNullException(nameof(comparisonEngine));
    }

    /// <summary>
    /// Lists configured environments (local + remotes) with availability.
    /// </summary>
    public async Task<ActionResult<IReadOnlyList<EnvironmentInfoDto>>> GetEnvironments(
        CancellationToken cancellationToken = default)
    {
        var providers = _registry.GetAll();
        var results = new List<EnvironmentInfoDto>(providers.Count);

        foreach (var provider in providers)
        {
            var descriptor = await provider.GetDescriptorAsync(cancellationToken).ConfigureAwait(false);
            var available = await provider.IsAvailableAsync(cancellationToken).ConfigureAwait(false);
            results.Add(new EnvironmentInfoDto(
                descriptor.Name,
                descriptor.DisplayName,
                descriptor.BaseUrl,
                descriptor.IsLocal,
                available));
        }

        return Ok(results);
    }

    /// <summary>
    /// Runs the comparison engine (read-only) for the selected environments.
    /// </summary>
    public async Task<ActionResult<ComparisonResult>> Compare(
        [FromBody] CompareRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            return BadRequest("Request body is required.");
        }

        try
        {
            var result = await _comparisonEngine
                .CompareAsync(request.ToComparisonRequest(), progress: null, cancellationToken)
                .ConfigureAwait(false);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
