using Asp.Versioning;
using EnvCompare.Backoffice.Models;
using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EnvCompare.Backoffice.Controllers;

/// <summary>
/// Read-only APIs for environment discovery and tree snapshots.
/// Remote providers call the same contract on peer EnvCompare installs.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = "EnvCompare")]
public sealed class EnvCompareApiController : EnvCompareApiControllerBase
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
    /// Health ping used to verify the package API is loaded.
    /// </summary>
    [HttpGet("ping")]
    [ProducesResponseType<string>(StatusCodes.Status200OK)]
    public string Ping() => "Pong";

    /// <summary>
    /// Health endpoint used by remote providers.
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Health() => Ok(new { status = "ok", package = Constants.PackageId });

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
    /// Paged content tree for the local environment (peer contract for remotes).
    /// </summary>
    [HttpGet("content")]
    [ProducesResponseType<PagedResultDto<ContentNodeSnapshot>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<ContentNodeSnapshot>>> GetContent(
        [FromQuery] Guid? parentKey,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        [FromQuery] string? culture = null,
        CancellationToken cancellationToken = default)
    {
        var local = RequireLocal();
        var page = await local.GetContentAsync(
            new TreeQuery(parentKey, skip, take, culture),
            cancellationToken).ConfigureAwait(false);
        return Ok(PagedResultDto<ContentNodeSnapshot>.From(page));
    }

    /// <summary>
    /// Single content node from the local environment.
    /// </summary>
    [HttpGet("content/{key:guid}")]
    [ProducesResponseType<ContentNodeSnapshot>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContentNodeSnapshot>> GetContentByKey(
        Guid key,
        CancellationToken cancellationToken)
    {
        var local = RequireLocal();
        var item = await local.GetContentByKeyAsync(key, cancellationToken).ConfigureAwait(false);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Paged media tree for the local environment.
    /// </summary>
    [HttpGet("media")]
    [ProducesResponseType<PagedResultDto<MediaNodeSnapshot>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<MediaNodeSnapshot>>> GetMedia(
        [FromQuery] Guid? parentKey,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var local = RequireLocal();
        var page = await local.GetMediaAsync(
            new TreeQuery(parentKey, skip, take),
            cancellationToken).ConfigureAwait(false);
        return Ok(PagedResultDto<MediaNodeSnapshot>.From(page));
    }

    /// <summary>
    /// Single media node from the local environment.
    /// </summary>
    [HttpGet("media/{key:guid}")]
    [ProducesResponseType<MediaNodeSnapshot>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MediaNodeSnapshot>> GetMediaByKey(
        Guid key,
        CancellationToken cancellationToken)
    {
        var local = RequireLocal();
        var item = await local.GetMediaByKeyAsync(key, cancellationToken).ConfigureAwait(false);
        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>
    /// Languages configured on the local environment.
    /// </summary>
    [HttpGet("languages")]
    [ProducesResponseType<IReadOnlyList<LanguageSnapshot>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LanguageSnapshot>>> GetLanguages(
        CancellationToken cancellationToken)
    {
        var local = RequireLocal();
        var languages = await local.GetLanguagesAsync(cancellationToken).ConfigureAwait(false);
        return Ok(languages);
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

    private IEnvironmentProvider RequireLocal()
    {
        var local = _registry.GetByName("Local")
            ?? _registry.GetAll().FirstOrDefault(p => p.IsLocal);

        return local
            ?? throw new InvalidOperationException("Local environment provider is not registered.");
    }
}
