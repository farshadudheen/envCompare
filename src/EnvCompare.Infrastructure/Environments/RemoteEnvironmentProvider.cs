using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Caching;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;
using Microsoft.Extensions.Logging;

namespace EnvCompare.Infrastructure.Environments;

/// <summary>
/// Environment provider that reads a remote EnvCompare HTTP API.
/// <see cref="RemoteEnvironmentOptions.ApiUrl"/> should be the remote site root (e.g. https://project-dev.umbraco.io).
/// Requests go to <c>envcompare/api/v1/...</c> on that host (same contract as this package's API).
/// </summary>
public sealed class RemoteEnvironmentProvider : IEnvironmentProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly RemoteEnvironmentOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IEnvironmentCache _cache;
    private readonly ILogger<RemoteEnvironmentProvider> _logger;
    private readonly TimeSpan _timeout;

    /// <summary>
    /// Creates a remote provider.
    /// </summary>
    public RemoteEnvironmentProvider(
        RemoteEnvironmentOptions options,
        IHttpClientFactory httpClientFactory,
        IEnvironmentCache cache,
        ILogger<RemoteEnvironmentProvider> logger,
        TimeSpan? timeout = null)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _timeout = timeout ?? TimeSpan.FromMinutes(2);

        if (string.IsNullOrWhiteSpace(_options.Name))
        {
            throw new ArgumentException("Remote environment name is required.", nameof(options));
        }
    }

    /// <inheritdoc />
    public string Name => _options.Name;

    /// <inheritdoc />
    public bool IsLocal => false;

    /// <inheritdoc />
    public Task<EnvironmentDescriptor> GetDescriptorAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new EnvironmentDescriptor(
            _options.Name,
            DisplayName: _options.Name,
            BaseUrl: NormalizeBaseUrl(_options.ApiUrl),
            IsLocal: false));
    }

    /// <inheritdoc />
    public async Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiUrl))
        {
            return false;
        }

        try
        {
            using var response = await SendAsync(HttpMethod.Get, $"{EnvComparePeerApiRoutes.Prefix}/health", cancellationToken)
                .ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            return body.TrimStart().StartsWith('{');
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException)
        {
            _logger.LogWarning(ex, "Remote environment {Name} health check failed.", Name);
            return false;
        }
    }

    /// <inheritdoc />
    public Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        var path =
            $"{EnvComparePeerApiRoutes.Prefix}/content?parentKey={query.ParentKey}&skip={query.Skip}&take={query.Take}&culture={Uri.EscapeDataString(query.Culture ?? string.Empty)}";

        return _cache.GetOrCreateAsync(
            $"{Name}:content:{query.ParentKey}:{query.Skip}:{query.Take}:{query.Culture}",
            async ct =>
            {
                var dto = await GetRequiredJsonAsync<PagedResultDto<ContentNodeSnapshot>>(path, ct)
                    .ConfigureAwait(false);
                return dto.ToResult(query.Skip, query.Take);
            },
            absoluteExpiration: TimeSpan.FromMinutes(1),
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<ContentNodeSnapshot?> GetContentByKeyAsync(
        Guid key,
        CancellationToken cancellationToken = default)
        => _cache.GetOrCreateAsync(
            $"{Name}:content:{key}",
            ct => GetOptionalJsonAsync<ContentNodeSnapshot>($"{EnvComparePeerApiRoutes.Prefix}/content/{key:D}", ct),
            absoluteExpiration: TimeSpan.FromMinutes(1),
            cancellationToken);

    /// <inheritdoc />
    public Task<EnvironmentPagedResult<MediaNodeSnapshot>> GetMediaAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        var path = $"{EnvComparePeerApiRoutes.Prefix}/media?parentKey={query.ParentKey}&skip={query.Skip}&take={query.Take}";

        return _cache.GetOrCreateAsync(
            $"{Name}:media:{query.ParentKey}:{query.Skip}:{query.Take}",
            async ct =>
            {
                var dto = await GetRequiredJsonAsync<PagedResultDto<MediaNodeSnapshot>>(path, ct)
                    .ConfigureAwait(false);
                return dto.ToResult(query.Skip, query.Take);
            },
            absoluteExpiration: TimeSpan.FromMinutes(1),
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<MediaNodeSnapshot?> GetMediaByKeyAsync(
        Guid key,
        CancellationToken cancellationToken = default)
        => _cache.GetOrCreateAsync(
            $"{Name}:media:{key}",
            ct => GetOptionalJsonAsync<MediaNodeSnapshot>($"{EnvComparePeerApiRoutes.Prefix}/media/{key:D}", ct),
            absoluteExpiration: TimeSpan.FromMinutes(1),
            cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<LanguageSnapshot>> GetLanguagesAsync(
        CancellationToken cancellationToken = default)
        => _cache.GetOrCreateAsync(
            $"{Name}:languages",
            async ct =>
            {
                var items = await GetRequiredJsonAsync<List<LanguageSnapshot>>($"{EnvComparePeerApiRoutes.Prefix}/languages", ct)
                    .ConfigureAwait(false);
                return (IReadOnlyList<LanguageSnapshot>)items;
            },
            absoluteExpiration: TimeSpan.FromMinutes(5),
            cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<ContentTypeSnapshot>> GetDocumentTypesAsync(
        CancellationToken cancellationToken = default)
        => _cache.GetOrCreateAsync(
            $"{Name}:document-types",
            async ct =>
            {
                var items = await GetRequiredJsonAsync<List<ContentTypeSnapshot>>(
                        $"{EnvComparePeerApiRoutes.Prefix}/document-types",
                        ct)
                    .ConfigureAwait(false);
                return (IReadOnlyList<ContentTypeSnapshot>)items;
            },
            absoluteExpiration: TimeSpan.FromMinutes(5),
            cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<ContentTypeSnapshot>> GetMediaTypesAsync(
        CancellationToken cancellationToken = default)
        => _cache.GetOrCreateAsync(
            $"{Name}:media-types",
            async ct =>
            {
                var items = await GetRequiredJsonAsync<List<ContentTypeSnapshot>>(
                        $"{EnvComparePeerApiRoutes.Prefix}/media-types",
                        ct)
                    .ConfigureAwait(false);
                return (IReadOnlyList<ContentTypeSnapshot>)items;
            },
            absoluteExpiration: TimeSpan.FromMinutes(5),
            cancellationToken);

    private async Task<T> GetRequiredJsonAsync<T>(string relativePath, CancellationToken cancellationToken)
    {
        using var response = await SendAsync(HttpMethod.Get, relativePath, cancellationToken)
            .ConfigureAwait(false);

        var body = await ReadResponseBodyAsync(response, relativePath, cancellationToken).ConfigureAwait(false);

        try
        {
            var payload = JsonSerializer.Deserialize<T>(body, JsonOptions);
            return payload ?? throw new InvalidOperationException($"Empty JSON response from {Name}/{relativePath}.");
        }
        catch (JsonException ex)
        {
            throw CreateNonJsonResponseException(relativePath, response.StatusCode, body, ex);
        }
    }

    private async Task<T?> GetOptionalJsonAsync<T>(string relativePath, CancellationToken cancellationToken)
        where T : class
    {
        using var response = await SendAsync(HttpMethod.Get, relativePath, cancellationToken)
            .ConfigureAwait(false);

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }

        var body = await ReadResponseBodyAsync(response, relativePath, cancellationToken).ConfigureAwait(false);

        try
        {
            return JsonSerializer.Deserialize<T>(body, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw CreateNonJsonResponseException(relativePath, response.StatusCode, body, ex);
        }
    }

    private async Task<string> ReadResponseBodyAsync(
        HttpResponseMessage response,
        string relativePath,
        CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        var requestUrl = response.RequestMessage?.RequestUri?.ToString() ?? $"{_options.ApiUrl}/{relativePath}";

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Remote environment {Name} returned HTTP {StatusCode} for {Url}. {BodySummary}",
                Name,
                (int)response.StatusCode,
                requestUrl,
                SummarizeBody(body));

            throw new InvalidOperationException(
                $"Remote environment '{Name}' returned HTTP {(int)response.StatusCode} for {requestUrl}. {SummarizeBody(body)}");
        }

        return body;
    }

    private InvalidOperationException CreateNonJsonResponseException(
        string relativePath,
        System.Net.HttpStatusCode statusCode,
        string body,
        JsonException inner)
    {
        var requestUrl = $"{NormalizeBaseUrl(_options.ApiUrl)}/{relativePath.TrimStart('/')}";
        var hint = body.TrimStart().StartsWith('<')
            ? "The remote site returned HTML instead of JSON (login page, 404, Umbraco Cloud Basic Auth, or blocked request). " +
              "Verify: (1) EnvCompare is installed on the remote site, (2) ApiUrl is the site root only, " +
              "(3) EnvCompare:PeerApiKey on the remote site matches Authentication on this environment, " +
              "(4) if the remote has Umbraco Cloud Public Access / Basic Auth enabled, set BasicAuthSharedSecret " +
              "to that environment's Umbraco:CMS:BasicAuth:SharedSecret:Value, " +
              $"(5) test GET {{url}}/{EnvComparePeerApiRoutes.Prefix}/health with Authorization: Bearer {{peer-key}} " +
              "and header X-Authentication-Shared-Secret: {basic-auth-secret} when Basic Auth is on."
            : "The response was not valid JSON.";

        _logger.LogWarning(
            inner,
            "Remote environment {Name} returned non-JSON from {Url}. {BodySummary}",
            Name,
            requestUrl,
            SummarizeBody(body));

        return new InvalidOperationException(
            $"Remote environment '{Name}' returned a non-JSON response from {requestUrl} (HTTP {(int)statusCode}). {hint} {SummarizeBody(body)}",
            inner);
    }

    private static string SummarizeBody(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return "Response body was empty.";
        }

        var trimmed = body.Trim();
        const int max = 200;
        return trimmed.Length <= max
            ? $"Body: {trimmed}"
            : $"Body starts with: {trimmed[..max]}…";
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string relativePath,
        CancellationToken cancellationToken)
    {
        var baseUrl = NormalizeBaseUrl(_options.ApiUrl)
            ?? throw new InvalidOperationException($"Remote environment '{Name}' has no ApiUrl configured.");

        var client = _httpClientFactory.CreateClient("EnvCompare.Remote");
        client.Timeout = _timeout;
        client.BaseAddress = new Uri(EnsureTrailingSlash(baseUrl));

        using var request = new HttpRequestMessage(method, relativePath.TrimStart('/'));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (!string.IsNullOrWhiteSpace(_options.Authentication))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Authentication);
        }

        if (!string.IsNullOrWhiteSpace(_options.BasicAuthSharedSecret))
        {
            var headerName = string.IsNullOrWhiteSpace(_options.BasicAuthSharedSecretHeader)
                ? UmbracoBasicAuthDefaults.SharedSecretHeaderName
                : _options.BasicAuthSharedSecretHeader.Trim();

            request.Headers.TryAddWithoutValidation(headerName, _options.BasicAuthSharedSecret);
        }

        return await client.SendAsync(request, cancellationToken).ConfigureAwait(false);
    }

    private static string? NormalizeBaseUrl(string? apiUrl)
        => string.IsNullOrWhiteSpace(apiUrl) ? null : apiUrl.Trim().TrimEnd('/');

    private static string EnsureTrailingSlash(string url)
        => url.EndsWith('/') ? url : url + "/";

    private sealed class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = [];
        public long Total { get; set; }

        public EnvironmentPagedResult<T> ToResult(int skip, int take)
            => new(Items, Total, skip, take);
    }
}
