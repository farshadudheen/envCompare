namespace EnvCompare.Core.Models;

/// <summary>
/// Metadata describing a compare target environment.
/// </summary>
/// <param name="Name">Logical environment name.</param>
/// <param name="DisplayName">UI display name.</param>
/// <param name="BaseUrl">Optional base URL for remote environments.</param>
/// <param name="IsLocal">Whether this is the currently running site.</param>
public sealed record EnvironmentDescriptor(
    string Name,
    string DisplayName,
    string? BaseUrl,
    bool IsLocal);
