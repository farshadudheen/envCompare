using EnvCompare.Backoffice.Authorization;
using EnvCompare.Backoffice.Models;
using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EnvCompare.Backoffice.Controllers;

/// <summary>
/// HTTP contract for remote EnvCompare installs (server-to-server tree snapshots).
/// Fixed route <c>/envcompare/api/v1/...</c> (outside <c>/umbraco/</c> to avoid backoffice auth redirects).
/// Routes are registered in <see cref="Composers.EnvComparePeerApiPipelineComposer"/> with <c>ShortCircuit()</c>
/// (conventional routing — not attribute routing).
/// </summary>
[AllowAnonymous]
[ServiceFilter(typeof(EnvComparePeerApiKeyFilter))]
public sealed class EnvComparePeerApiController : ControllerBase
{
    private readonly IEnvironmentProviderRegistry _registry;

    /// <summary>
    /// Creates the controller.
    /// </summary>
    public EnvComparePeerApiController(IEnvironmentProviderRegistry registry)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
    }

    /// <summary>
    /// Health ping used to verify the package API is loaded.
    /// </summary>
    [ProducesResponseType<string>(StatusCodes.Status200OK)]
    public string Ping() => "Pong";

    /// <summary>
    /// Health endpoint used by remote providers.
    /// </summary>
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Health() => Ok(new { status = "ok", package = Constants.PackageId });

    /// <summary>
    /// Paged content tree for the local environment (peer contract for remotes).
    /// </summary>
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
    [ProducesResponseType<IReadOnlyList<LanguageSnapshot>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LanguageSnapshot>>> GetLanguages(
        CancellationToken cancellationToken)
    {
        var local = RequireLocal();
        var languages = await local.GetLanguagesAsync(cancellationToken).ConfigureAwait(false);
        return Ok(languages);
    }

    private IEnvironmentProvider RequireLocal()
    {
        var local = _registry.GetByName("Local")
            ?? _registry.GetAll().FirstOrDefault(p => p.IsLocal);

        return local
            ?? throw new InvalidOperationException("Local environment provider is not registered.");
    }
}
