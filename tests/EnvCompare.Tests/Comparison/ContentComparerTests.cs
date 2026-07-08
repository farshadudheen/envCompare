using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Comparison.Content;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;

namespace EnvCompare.Tests.Comparison;

public sealed class ContentComparerTests
{
    [Fact]
    public async Task CompareAsync_DetectsAddedMissingAndModified()
    {
        var keyShared = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var keyOnlyA = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var keyOnlyB = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        var providerA = new FakeEnvironmentProvider(
            "A",
            [
                Node(keyShared, "Home", "home", parent: null, sort: 0),
                Node(keyOnlyA, "About", "page", parent: keyShared, sort: 1),
            ],
            []);

        var providerB = new FakeEnvironmentProvider(
            "B",
            [
                Node(keyShared, "Home Renamed", "home", parent: null, sort: 2),
                Node(keyOnlyB, "Contact", "page", parent: keyShared, sort: 1),
            ],
            []);

        var comparer = new ContentComparer();
        var result = await comparer.CompareAsync(new ComparisonContext(
            providerA,
            providerB,
            new ComparisonRequest("A", "B"),
            new EnvCompareOptions()));

        Assert.Equal(3, result.TotalCompared);
        Assert.Equal(1, result.ModifiedCount);
        Assert.Equal(1, result.MissingCount);
        Assert.Equal(1, result.AddedCount);

        Assert.Contains(result.Items, i => i.Id == keyShared.ToString("D") && i.Status == DifferenceType.Modified);
        Assert.Contains(result.Items, i => i.Id == keyOnlyA.ToString("D") && i.Status == DifferenceType.Missing);
        Assert.Contains(result.Items, i => i.Id == keyOnlyB.ToString("D") && i.Status == DifferenceType.Added);
    }

    [Fact]
    public async Task CompareAsync_MarksIgnoredContentTypes()
    {
        var key = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        var providerA = new FakeEnvironmentProvider(
            "A",
            [Node(key, "Folder", "folder", parent: null, sort: 0)],
            []);
        var providerB = new FakeEnvironmentProvider(
            "B",
            [Node(key, "Folder", "folder", parent: null, sort: 1)],
            []);

        var options = new EnvCompareOptions
        {
            IgnoredContentTypes = { "folder" }
        };

        var result = await new ContentComparer().CompareAsync(new ComparisonContext(
            providerA,
            providerB,
            new ComparisonRequest("A", "B"),
            options));

        Assert.Equal(1, result.IgnoredCount);
        Assert.Equal(DifferenceType.Ignored, result.Items[0].Status);
    }

    private static ContentNodeSnapshot Node(
        Guid key,
        string name,
        string type,
        Guid? parent,
        int sort)
        => new(key, 1, name, type, parent, $"/-1/{key:N}", parent is null ? 1 : 2, sort, true, []);

    private sealed class FakeEnvironmentProvider(
        string name,
        IReadOnlyList<ContentNodeSnapshot> content,
        IReadOnlyList<MediaNodeSnapshot> _) : IEnvironmentProvider
    {
        public string Name { get; } = name;
        public bool IsLocal => true;

        public Task<EnvironmentDescriptor> GetDescriptorAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new EnvironmentDescriptor(Name, Name, null, true));

        public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
            TreeQuery query,
            CancellationToken cancellationToken = default)
        {
            var filtered = content
                .Where(c => c.ParentKey == query.ParentKey)
                .Skip(query.Skip)
                .Take(query.Take)
                .ToArray();
            var total = content.Count(c => c.ParentKey == query.ParentKey);
            return Task.FromResult(new EnvironmentPagedResult<ContentNodeSnapshot>(filtered, total, query.Skip, query.Take));
        }

        public Task<ContentNodeSnapshot?> GetContentByKeyAsync(Guid key, CancellationToken cancellationToken = default)
            => Task.FromResult(content.FirstOrDefault(c => c.Key == key));

        public Task<EnvironmentPagedResult<MediaNodeSnapshot>> GetMediaAsync(
            TreeQuery query,
            CancellationToken cancellationToken = default)
            => Task.FromResult(new EnvironmentPagedResult<MediaNodeSnapshot>([], 0, query.Skip, query.Take));

        public Task<MediaNodeSnapshot?> GetMediaByKeyAsync(Guid key, CancellationToken cancellationToken = default)
            => Task.FromResult<MediaNodeSnapshot?>(null);

        public Task<IReadOnlyList<LanguageSnapshot>> GetLanguagesAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<LanguageSnapshot>>([]);
    }
}
