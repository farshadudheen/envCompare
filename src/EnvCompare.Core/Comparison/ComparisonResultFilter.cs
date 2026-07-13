using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Applies request-level filters to comparison rows.
/// </summary>
public static class ComparisonResultFilter
{
    /// <summary>
    /// Filters result items by request criteria.
    /// </summary>
    public static ComparisonResult Apply(ComparisonResult result, ComparisonRequest request)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(request);

        IEnumerable<ComparisonItem> items = result.Items;

        if (!string.IsNullOrWhiteSpace(request.Culture))
        {
            items = items.Where(i =>
                string.IsNullOrWhiteSpace(i.Culture) ||
                string.Equals(i.Culture, request.Culture, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.ContentType))
        {
            items = items.Where(i =>
                string.Equals(i.ContentType, request.ContentType, StringComparison.OrdinalIgnoreCase));
        }

        if (request.Status is { } status)
        {
            items = items.Where(i => i.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            items = items.Where(i =>
                i.Name.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                i.Id.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                (i.Path?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (i.ContentType?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (i.DifferenceSummary?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        return ComparisonResult.FromItems(items.ToArray());
    }
}
