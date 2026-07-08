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
    /// Package semantic version (keep aligned with Client package.json and umbraco-package.json).
    /// </summary>
    public const string PackageVersion = "0.1.0";

    /// <summary>
    /// OpenAPI / Swagger document name for EnvCompare management APIs.
    /// </summary>
    public const string ApiName = "envcompare";

    /// <summary>
    /// Package alias prefix for backoffice extensions.
    /// </summary>
    public const string PackageAliasPrefix = "EnvCompare";

    /// <summary>
    /// Virtual root path for packaged static assets.
    /// </summary>
    public const string AppPluginsPath = "/App_Plugins/EnvCompare";
}
