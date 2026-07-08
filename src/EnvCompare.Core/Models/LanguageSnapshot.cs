namespace EnvCompare.Core.Models;

/// <summary>
/// Language / culture snapshot from an environment.
/// </summary>
/// <param name="IsoCode">ISO culture code.</param>
/// <param name="CultureName">Display name.</param>
/// <param name="IsDefault">Whether this is the default language.</param>
/// <param name="IsMandatory">Whether mandatory.</param>
public sealed record LanguageSnapshot(
    string IsoCode,
    string CultureName,
    bool IsDefault,
    bool IsMandatory);
