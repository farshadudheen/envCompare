using EnvCompare.Core.Models;

namespace EnvCompare.Backoffice.Models;

/// <summary>
/// API DTO for an environment option in the dashboard.
/// </summary>
/// <param name="Name">Logical name.</param>
/// <param name="DisplayName">UI label.</param>
/// <param name="BaseUrl">Optional remote base URL.</param>
/// <param name="IsLocal">Whether this is the running site.</param>
/// <param name="IsAvailable">Connectivity probe result.</param>
public sealed record EnvironmentInfoDto(
    string Name,
    string DisplayName,
    string? BaseUrl,
    bool IsLocal,
    bool IsAvailable);

/// <summary>
/// API DTO for paged tree results.
/// </summary>
public sealed record PagedResultDto<T>(
    IReadOnlyList<T> Items,
    long Total,
    int Skip,
    int Take)
{
    public static PagedResultDto<T> From(EnvironmentPagedResult<T> source)
        => new(source.Items, source.Total, source.Skip, source.Take);
}

/// <summary>
/// Body for starting a comparison.
/// </summary>
public sealed class CompareRequestDto
{
    /// <summary>Environment A name.</summary>
    public string EnvironmentA { get; set; } = string.Empty;

    /// <summary>Environment B name.</summary>
    public string EnvironmentB { get; set; } = string.Empty;

    /// <summary>Optional module aliases (content, media, settings, dictionary).</summary>
    public IList<string>? Modules { get; set; }

    /// <summary>Optional culture filter.</summary>
    public string? Culture { get; set; }

    /// <summary>Optional content type filter.</summary>
    public string? ContentType { get; set; }

    /// <summary>Optional status filter.</summary>
    public string? Status { get; set; }

    /// <summary>Optional keyword search.</summary>
    public string? Search { get; set; }

    /// <summary>
    /// Maps to a core <see cref="ComparisonRequest"/>.
    /// </summary>
    public ComparisonRequest ToComparisonRequest()
    {
        DifferenceType? status = null;
        if (!string.IsNullOrWhiteSpace(Status) &&
            Enum.TryParse<DifferenceType>(Status, ignoreCase: true, out var parsed))
        {
            status = parsed;
        }

        return new ComparisonRequest(
            EnvironmentA.Trim(),
            EnvironmentB.Trim(),
            Modules?.Where(m => !string.IsNullOrWhiteSpace(m)).ToArray(),
            Culture,
            ContentType,
            status,
            Search);
    }
}
