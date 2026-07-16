using System.Reflection;

namespace EnvCompare.Backoffice;

/// <summary>
/// Shared constants for the EnvCompare package.
/// </summary>
public static class Constants
{
    /// <summary>
    /// NuGet / package identifier.
    /// </summary>
    public const string PackageId = "EnvCompare";

    /// <summary>
    /// Package semantic version from the built assembly (matches <c>&lt;Version&gt;</c> in the csproj).
    /// </summary>
    public static string PackageVersion { get; } =
        typeof(Constants).Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
        ?? typeof(Constants).Assembly.GetName().Version?.ToString(3)
        ?? "0.0.0";

    /// <summary>
    /// Plugin controller area name used in backoffice API routes.
    /// </summary>
    public const string PluginArea = "EnvCompare";

    /// <summary>
    /// Package alias prefix for backoffice extensions.
    /// </summary>
    public const string PackageAliasPrefix = "EnvCompare";

    /// <summary>
    /// Virtual root path for packaged static assets.
    /// </summary>
    public const string AppPluginsPath = "/App_Plugins/EnvCompare";
}
