using EnvCompare.Core.Comparison;
using EnvCompare.Core.Models;
using EnvCompare.Tests.TestHelpers;

namespace EnvCompare.Tests.Comparison;

public sealed class TreeLoaderTests
{
    [Fact]
    public async Task LoadContentTreeAsync_WalksBreadthFirstAcrossPages()
    {
        var root = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var child = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var grandchild = Guid.Parse("33333333-3333-3333-3333-333333333333");

        var provider = new PagedFakeProvider(
            "A",
            [
                SnapshotBuilder.Content(root, "Root", "home", parent: null),
                SnapshotBuilder.Content(child, "Child", "page", parent: root, level: 2),
                SnapshotBuilder.Content(grandchild, "Grandchild", "page", parent: child, level: 3),
            ]);

        var tree = await TreeLoader.LoadContentTreeAsync(provider, CancellationToken.None, pageSize: 1);

        Assert.Equal(3, tree.Count);
        Assert.Equal("Root", tree[0].Name);
        Assert.Equal("Child", tree[1].Name);
        Assert.Equal("Grandchild", tree[2].Name);
    }

    [Fact]
    public async Task LoadMediaTreeAsync_RespectsMaxNodesCap()
    {
        var root = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var child = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        var provider = new FakeEnvironmentProvider(
            "A",
            media:
            [
                SnapshotBuilder.Media(root, "Root", "Folder"),
                SnapshotBuilder.Media(child, "Child", "Image", parent: root),
            ]);

        var tree = await TreeLoader.LoadMediaTreeAsync(provider, CancellationToken.None, pageSize: 50, maxNodes: 1);

        Assert.Single(tree);
        Assert.Equal("Root", tree[0].Name);
    }

    private sealed class PagedFakeProvider(string name, IReadOnlyList<ContentNodeSnapshot> content)
        : FakeEnvironmentProvider(name, content)
    {
        public override Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
            TreeQuery query,
            CancellationToken cancellationToken = default)
        {
            var filtered = Content
                .Where(c => c.ParentKey == query.ParentKey)
                .Skip(query.Skip)
                .Take(1)
                .ToArray();
            var total = Content.Count(c => c.ParentKey == query.ParentKey);
            return Task.FromResult(new EnvironmentPagedResult<ContentNodeSnapshot>(filtered, total, query.Skip, 1));
        }
    }
}
