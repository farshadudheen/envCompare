using EnvCompare.Core.Comparison;
using EnvCompare.Core.Models;

namespace EnvCompare.Tests.Comparison;

public sealed class ComparisonResultFilterTests
{
    [Fact]
    public void Apply_FiltersBySearchAndStatus()
    {
        var source = ComparisonResult.FromItems(
        [
            new ComparisonItem("1", "Home", "home", "/home", null, null, DifferenceType.Identical, "a", "a", null, "content"),
            new ComparisonItem("2", "About", "page", "/about", null, null, DifferenceType.Modified, "a", "b", "Changed: name", "content"),
            new ComparisonItem("3", "News", "page", "/news", null, null, DifferenceType.Added, null, "b", null, "content"),
        ]);

        var filtered = ComparisonResultFilter.Apply(
            source,
            new ComparisonRequest("A", "B", Search: "about", Status: DifferenceType.Modified));

        Assert.Single(filtered.Items);
        Assert.Equal("2", filtered.Items[0].Id);
        Assert.Equal(1, filtered.ModifiedCount);
    }
}
