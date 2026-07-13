namespace EnvCompare.Core.Configuration;

/// <summary>
/// Configuration bound from appsettings (section <c>EnvCompare</c>).
/// Binding and validation are wired in Infrastructure (Step 4+).
/// </summary>
public sealed class EnvCompareOptions
{
    /// <summary>
    /// Configuration section name.
    /// </summary>
    public const string SectionName = "EnvCompare";

    /// <summary>
    /// Configured remote environments (URL, auth, etc.).
    /// </summary>
    public IList<RemoteEnvironmentOptions> Environments { get; init; } = [];

    /// <summary>
    /// HTTP timeout for remote calls.
    /// </summary>
    public TimeSpan Timeout { get; init; } = TimeSpan.FromMinutes(2);

    /// <summary>
    /// Property aliases ignored during property comparison.
    /// </summary>
    public IList<string> IgnoredProperties { get; init; } = [];

    /// <summary>
    /// Content type aliases ignored during content comparison.
    /// </summary>
    public IList<string> IgnoredContentTypes { get; init; } = [];

    /// <summary>
    /// Content paths ignored during comparison.
    /// </summary>
    public IList<string> IgnoredPaths { get; init; } = [];

    /// <summary>
    /// Shared secret for inbound peer API calls. Remote callers must send this as Bearer token
    /// in their environment's <c>Authentication</c> setting.
    /// </summary>
    public string? PeerApiKey { get; init; }
}

/// <summary>
/// Remote environment connection settings.
/// </summary>
public sealed class RemoteEnvironmentOptions
{
    /// <summary>
    /// Logical name (Development, Staging, Production).
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Base API URL.
    /// </summary>
    public string? ApiUrl { get; init; }

    /// <summary>
    /// EnvCompare peer API key sent as <c>Authorization: Bearer {value}</c>.
    /// Must match the remote site's <see cref="EnvCompareOptions.PeerApiKey"/>.
    /// </summary>
    public string? Authentication { get; init; }

    /// <summary>
    /// Umbraco Cloud Basic Auth shared secret for the remote site (when Public Access is enabled).
    /// Sent as <see cref="BasicAuthSharedSecretHeader"/> so peer API calls are not blocked.
    /// Copy from the target Cloud environment's
    /// <c>Umbraco:CMS:BasicAuth:SharedSecret:Value</c> setting.
    /// </summary>
    public string? BasicAuthSharedSecret { get; init; }

    /// <summary>
    /// Header name for <see cref="BasicAuthSharedSecret"/>.
    /// Defaults to <c>X-Authentication-Shared-Secret</c>.
    /// </summary>
    public string? BasicAuthSharedSecretHeader { get; init; }
}

/// <summary>
/// Default Umbraco Basic Auth bypass header (see Umbraco:CMS:BasicAuth:SharedSecret).
/// </summary>
public static class UmbracoBasicAuthDefaults
{
    /// <summary>
    /// Default shared-secret header name used by Umbraco Basic Auth.
    /// </summary>
    public const string SharedSecretHeaderName = "X-Authentication-Shared-Secret";
}
