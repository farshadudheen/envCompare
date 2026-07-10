using EnvCompare.Core.Comparison.Media;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;
using EnvCompare.Tests.TestHelpers;

namespace EnvCompare.Tests.Comparison;

public sealed class MediaComparerTests
{
    [Fact]
    public async Task CompareAsync_DetectsFilenameAndHierarchyChanges()
    {
        var shared = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var onlyA = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var onlyB = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        var providerA = new FakeEnvironmentProvider(
            "A",
            media:
            [
                SnapshotBuilder.Media(shared, "Hero", "Image", fileName: "hero-a.jpg"),
                SnapshotBuilder.Media(onlyA, "Logo", "Image", fileName: "logo.png"),
            ]);

        var providerB = new FakeEnvironmentProvider(
            "B",
            media:
            [
                SnapshotBuilder.Media(shared, "Hero", "Image", fileName: "hero-b.jpg"),
                SnapshotBuilder.Media(onlyB, "Banner", "Image", fileName: "banner.png"),
            ]);

        var result = await new MediaComparer().CompareAsync(new ComparisonContext(
            providerA,
            providerB,
            new ComparisonRequest("A", "B"),
            new EnvCompareOptions()));

        Assert.Equal(3, result.TotalCompared);
        Assert.Equal(1, result.ModifiedCount);
        Assert.Equal(1, result.MissingCount);
        Assert.Equal(1, result.AddedCount);

        var modified = Assert.Single(result.Items, i => i.Status == DifferenceType.Modified);
        Assert.Contains("filename", modified.DifferenceSummary, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompareAsync_MarksIgnoredPaths()
    {
        var key = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        var path = "-1,archive,media";

        var providerA = new FakeEnvironmentProvider(
            "A",
            media: [new MediaNodeSnapshot(key, 1, "Archive", "Folder", null, path, 1, 0, null)]);
        var providerB = new FakeEnvironmentProvider(
            "B",
            media: [new MediaNodeSnapshot(key, 1, "Archive", "Folder", null, path, 1, 1, null)]);

        var options = new EnvCompareOptions
        {
            IgnoredPaths = { "archive" }
        };

        var result = await new MediaComparer().CompareAsync(new ComparisonContext(
            providerA,
            providerB,
            new ComparisonRequest("A", "B"),
            options));

        Assert.Equal(1, result.IgnoredCount);
        Assert.Equal(DifferenceType.Ignored, result.Items[0].Status);
    }
}
