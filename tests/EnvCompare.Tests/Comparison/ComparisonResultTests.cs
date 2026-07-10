using EnvCompare.Core.Models;

namespace EnvCompare.Tests.Comparison;

public sealed class ComparisonResultTests
{
    [Fact]
    public void Empty_HasZeroCounts()
    {
        var result = ComparisonResult.Empty;

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCompared);
        Assert.Equal(0, result.IdenticalCount);
        Assert.Equal(0, result.AddedCount);
        Assert.Equal(0, result.MissingCount);
        Assert.Equal(0, result.ModifiedCount);
        Assert.Equal(0, result.IgnoredCount);
    }

    [Fact]
    public void FromItems_AggregatesStatusCounts()
    {
        var result = ComparisonResult.FromItems(
        [
            Item(DifferenceType.Identical),
            Item(DifferenceType.Added),
            Item(DifferenceType.Missing),
            Item(DifferenceType.Modified),
            Item(DifferenceType.Ignored),
        ]);

        Assert.Equal(5, result.TotalCompared);
        Assert.Equal(1, result.IdenticalCount);
        Assert.Equal(1, result.AddedCount);
        Assert.Equal(1, result.MissingCount);
        Assert.Equal(1, result.ModifiedCount);
        Assert.Equal(1, result.IgnoredCount);
    }

    [Fact]
    public void Merge_CombinesModuleResults()
    {
        var content = ComparisonResult.FromItems([Item(DifferenceType.Modified, "content")]);
        var media = ComparisonResult.FromItems([Item(DifferenceType.Added, "media")]);

        var merged = ComparisonResult.Merge([content, media]);

        Assert.Equal(2, merged.TotalCompared);
        Assert.Equal(1, merged.ModifiedCount);
        Assert.Equal(1, merged.AddedCount);
    }

    private static ComparisonItem Item(DifferenceType status, string module = "content")
        => new("id", "Name", "type", "/path", null, null, status, "a", "b", null, module);
}
