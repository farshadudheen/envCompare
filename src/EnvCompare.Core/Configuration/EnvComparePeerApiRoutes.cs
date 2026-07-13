namespace EnvCompare.Core.Configuration;

/// <summary>
/// Route prefix for the server-to-server peer API.
/// Must not live under <c>/umbraco/</c> — Umbraco backoffice auth intercepts that path.
/// </summary>
public static class EnvComparePeerApiRoutes
{
    /// <summary>
    /// Relative path prefix, e.g. <c>envcompare/api/v1/health</c>.
    /// </summary>
    public const string Prefix = "envcompare/api/v1";
}
