namespace EnvCompare.Core.Models;

/// <summary>
/// Paged result wrapper used by environment providers.
/// Named to avoid clashing with Umbraco.Cms.Core.Models.PagedResult{T}.
/// </summary>
/// <typeparam name="T">Item type.</typeparam>
/// <param name="Items">Page items.</param>
/// <param name="Total">Total matching items.</param>
/// <param name="Skip">Skip applied.</param>
/// <param name="Take">Take applied.</param>
public sealed record EnvironmentPagedResult<T>(
    IReadOnlyList<T> Items,
    long Total,
    int Skip,
    int Take);
