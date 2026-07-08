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
    /// Authentication configuration key or token placeholder (not stored as secret in code).
    /// </summary>
    public string? Authentication { get; init; }
}
