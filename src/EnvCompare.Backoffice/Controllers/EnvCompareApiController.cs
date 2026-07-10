using EnvCompare.Backoffice.Models;
using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EnvCompare.Backoffice.Controllers;

/// <summary>
/// Management API for the EnvCompare backoffice dashboard.
/// </summary>
[ApiExplorerSettings(GroupName = "EnvCompare")]
public sealed class EnvCompareApiController : EnvCompareManagementApiControllerBase
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
    [HttpGet("environments")]
    [ProducesResponseType<IReadOnlyList<EnvironmentInfoDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EnvironmentInfoDto>>> GetEnvironments(
        CancellationToken cancellationToken)
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
    [HttpPost("compare")]
    [ProducesResponseType<ComparisonResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ComparisonResult>> Compare(
        [FromBody] CompareRequestDto request,
        CancellationToken cancellationToken)
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
