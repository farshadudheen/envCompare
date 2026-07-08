using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Caching;
using EnvCompare.Core.Models;
using EnvCompare.Infrastructure.Mapping;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace EnvCompare.Infrastructure.Environments;

/// <summary>
/// Environment provider for the currently running Umbraco site.
/// Reads content/media via Umbraco management services (read-only).
/// </summary>
public sealed class LocalEnvironmentProvider : IEnvironmentProvider
{
    private readonly IContentService _contentService;
    private readonly IMediaService _mediaService;
    private readonly ILanguageService _languageService;
    private readonly IEnvironmentCache _cache;
    private readonly ILogger<LocalEnvironmentProvider> _logger;

    /// <summary>
    /// Creates a local provider.
    /// </summary>
    public LocalEnvironmentProvider(
        IContentService contentService,
        IMediaService mediaService,
        ILanguageService languageService,
        IEnvironmentCache cache,
        ILogger<LocalEnvironmentProvider> logger)
    {
        _contentService = contentService ?? throw new ArgumentNullException(nameof(contentService));
        _mediaService = mediaService ?? throw new ArgumentNullException(nameof(mediaService));
        _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public string Name => "Local";

    /// <inheritdoc />
    public bool IsLocal => true;

    /// <inheritdoc />
    public Task<EnvironmentDescriptor> GetDescriptorAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new EnvironmentDescriptor(
            Name,
            DisplayName: "Local",
            BaseUrl: null,
            IsLocal: true));
    }

    /// <inheritdoc />
    public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(true);
    }

    /// <inheritdoc />
    public async Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        cancellationToken.ThrowIfCancellationRequested();

        var cacheKey = $"local:content:{query.ParentKey}:{query.Skip}:{query.Take}";
        return await _cache.GetOrCreateAsync(
            cacheKey,
            _ => Task.FromResult(LoadContentPage(query)),
            absoluteExpiration: TimeSpan.FromMinutes(1),
            cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public Task<ContentNodeSnapshot?> GetContentByKeyAsync(
        Guid key,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var content = _contentService.GetById(key);
        if (content is null)
        {
            return Task.FromResult<ContentNodeSnapshot?>(null);
        }

        var parentKey = ResolveParentKey(content.ParentId, id => _contentService.GetById(id)?.Key);
        return Task.FromResult<ContentNodeSnapshot?>(SnapshotMapper.ToContentSnapshot(content, parentKey));
    }

    /// <inheritdoc />
    public async Task<EnvironmentPagedResult<MediaNodeSnapshot>> GetMediaAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        cancellationToken.ThrowIfCancellationRequested();

        var cacheKey = $"local:media:{query.ParentKey}:{query.Skip}:{query.Take}";
        return await _cache.GetOrCreateAsync(
            cacheKey,
            _ => Task.FromResult(LoadMediaPage(query)),
            absoluteExpiration: TimeSpan.FromMinutes(1),
            cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public Task<MediaNodeSnapshot?> GetMediaByKeyAsync(
        Guid key,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var media = _mediaService.GetById(key);
        if (media is null)
        {
            return Task.FromResult<MediaNodeSnapshot?>(null);
        }

        var parentKey = ResolveParentKey(media.ParentId, id => _mediaService.GetById(id)?.Key);
        return Task.FromResult<MediaNodeSnapshot?>(SnapshotMapper.ToMediaSnapshot(media, parentKey));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<LanguageSnapshot>> GetLanguagesAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await _cache.GetOrCreateAsync(
            "local:languages",
            async ct =>
            {
                ct.ThrowIfCancellationRequested();
                var languages = await _languageService.GetAllAsync().ConfigureAwait(false);
                return (IReadOnlyList<LanguageSnapshot>)languages
                    .Select(l => new LanguageSnapshot(
                        l.IsoCode,
                        l.CultureName,
                        l.IsDefault,
                        l.IsMandatory))
                    .ToArray();
            },
            absoluteExpiration: TimeSpan.FromMinutes(5),
            cancellationToken).ConfigureAwait(false);
    }

    private EnvironmentPagedResult<ContentNodeSnapshot> LoadContentPage(TreeQuery query)
    {
        var (skip, take) = NormalizePaging(query.Skip, query.Take);
        var pageIndex = skip / take;

        if (query.ParentKey is null)
        {
            var roots = _contentService.GetRootContent()
                .OrderBy(c => c.SortOrder)
                .ToList();

            var page = roots
                .Skip(skip)
                .Take(take)
                .Select(c => SnapshotMapper.ToContentSnapshot(c, parentKey: null))
                .ToArray();

            return new EnvironmentPagedResult<ContentNodeSnapshot>(page, roots.Count, skip, take);
        }

        var parent = _contentService.GetById(query.ParentKey.Value);
        if (parent is null)
        {
            _logger.LogDebug("Local content parent {ParentKey} was not found.", query.ParentKey);
            return new EnvironmentPagedResult<ContentNodeSnapshot>([], 0, skip, take);
        }

        var children = _contentService
            .GetPagedChildren(parent.Id, pageIndex, take, out var total)
            .Select(c => SnapshotMapper.ToContentSnapshot(c, parent.Key))
            .ToArray();

        return new EnvironmentPagedResult<ContentNodeSnapshot>(children, total, skip, take);
    }

    private EnvironmentPagedResult<MediaNodeSnapshot> LoadMediaPage(TreeQuery query)
    {
        var (skip, take) = NormalizePaging(query.Skip, query.Take);
        var pageIndex = skip / take;

        if (query.ParentKey is null)
        {
            var roots = _mediaService.GetRootMedia()
                .OrderBy(m => m.SortOrder)
                .ToList();

            var page = roots
                .Skip(skip)
                .Take(take)
                .Select(m => SnapshotMapper.ToMediaSnapshot(m, parentKey: null))
                .ToArray();

            return new EnvironmentPagedResult<MediaNodeSnapshot>(page, roots.Count, skip, take);
        }

        var parent = _mediaService.GetById(query.ParentKey.Value);
        if (parent is null)
        {
            _logger.LogDebug("Local media parent {ParentKey} was not found.", query.ParentKey);
            return new EnvironmentPagedResult<MediaNodeSnapshot>([], 0, skip, take);
        }

        var children = _mediaService
            .GetPagedChildren(parent.Id, pageIndex, take, out var total)
            .Select(m => SnapshotMapper.ToMediaSnapshot(m, parent.Key))
            .ToArray();

        return new EnvironmentPagedResult<MediaNodeSnapshot>(children, total, skip, take);
    }

    private static Guid? ResolveParentKey(int parentId, Func<int, Guid?> resolver)
    {
        if (parentId <= Constants.System.Root)
        {
            return null;
        }

        return resolver(parentId);
    }

    private static (int Skip, int Take) NormalizePaging(int skip, int take)
    {
        skip = Math.Max(0, skip);
        take = take <= 0 ? 50 : Math.Min(take, 200);
        return (skip, take);
    }
}
