using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Models;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Loads a bounded breadth-first tree snapshot from an environment provider.
/// </summary>
internal static class TreeLoader
{
    public static async Task<IReadOnlyList<ContentNodeSnapshot>> LoadContentTreeAsync(
        IEnvironmentProvider provider,
        CancellationToken cancellationToken,
        int pageSize = ComparisonHelpers.DefaultPageSize,
        int maxNodes = ComparisonHelpers.MaxNodes)
    {
        var results = new List<ContentNodeSnapshot>();
        var queue = new Queue<Guid?>();
        queue.Enqueue(null);

        while (queue.Count > 0 && results.Count < maxNodes)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var parentKey = queue.Dequeue();
            var skip = 0;

            while (results.Count < maxNodes)
            {
                var page = await provider.GetContentAsync(
                    new TreeQuery(parentKey, skip, pageSize),
                    cancellationToken).ConfigureAwait(false);

                if (page.Items.Count == 0)
                {
                    break;
                }

                foreach (var item in page.Items)
                {
                    results.Add(item);
                    queue.Enqueue(item.Key);
                    if (results.Count >= maxNodes)
                    {
                        break;
                    }
                }

                skip += page.Items.Count;
                if (skip >= page.Total)
                {
                    break;
                }
            }
        }

        return results;
    }

    public static async Task<IReadOnlyList<MediaNodeSnapshot>> LoadMediaTreeAsync(
        IEnvironmentProvider provider,
        CancellationToken cancellationToken,
        int pageSize = ComparisonHelpers.DefaultPageSize,
        int maxNodes = ComparisonHelpers.MaxNodes)
    {
        var results = new List<MediaNodeSnapshot>();
        var queue = new Queue<Guid?>();
        queue.Enqueue(null);

        while (queue.Count > 0 && results.Count < maxNodes)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var parentKey = queue.Dequeue();
            var skip = 0;

            while (results.Count < maxNodes)
            {
                var page = await provider.GetMediaAsync(
                    new TreeQuery(parentKey, skip, pageSize),
                    cancellationToken).ConfigureAwait(false);

                if (page.Items.Count == 0)
                {
                    break;
                }

                foreach (var item in page.Items)
                {
                    results.Add(item);
                    queue.Enqueue(item.Key);
                    if (results.Count >= maxNodes)
                    {
                        break;
                    }
                }

                skip += page.Items.Count;
                if (skip >= page.Total)
                {
                    break;
                }
            }
        }

        return results;
    }
}
