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
}
