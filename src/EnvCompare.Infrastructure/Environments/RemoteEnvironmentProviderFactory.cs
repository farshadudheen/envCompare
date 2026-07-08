using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Caching;
using EnvCompare.Core.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EnvCompare.Infrastructure.Environments;

/// <summary>
/// Creates <see cref="RemoteEnvironmentProvider"/> instances from configuration.
/// </summary>
public sealed class RemoteEnvironmentProviderFactory : IRemoteEnvironmentProviderFactory
{
    private readonly IOptionsMonitor<EnvCompareOptions> _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IEnvironmentCache _cache;
    private readonly ILoggerFactory _loggerFactory;

    /// <summary>
    /// Creates the factory.
    /// </summary>
    public RemoteEnvironmentProviderFactory(
        IOptionsMonitor<EnvCompareOptions> options,
        IHttpClientFactory httpClientFactory,
        IEnvironmentCache cache,
        ILoggerFactory loggerFactory)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _loggerFactory = loggerFactory ?? throw new ArgumentNullException(nameof(loggerFactory));
    }

    /// <inheritdoc />
    public IReadOnlyList<IEnvironmentProvider> CreateConfiguredRemotes()
    {
        var options = _options.CurrentValue;
        var logger = _loggerFactory.CreateLogger<RemoteEnvironmentProvider>();

        return options.Environments
            .Where(e => !string.IsNullOrWhiteSpace(e.Name))
            .Where(e => !string.Equals(e.Name, "Local", StringComparison.OrdinalIgnoreCase))
            .Select(e => (IEnvironmentProvider)new RemoteEnvironmentProvider(
                e,
                _httpClientFactory,
                _cache,
                logger,
                options.Timeout))
            .ToArray();
    }
}
