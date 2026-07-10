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

    [Fact]
    public void Apply_FiltersByCultureContentTypeAndPath()
    {
        var source = ComparisonResult.FromItems(
        [
            new ComparisonItem("1", "Home", "home", "/site/home", "en-US", null, DifferenceType.Identical, "a", "a", null, "content"),
            new ComparisonItem("2", "Hem", "home", "/site/hem", "sv-SE", null, DifferenceType.Modified, "a", "b", null, "content"),
            new ComparisonItem("3", "Asset", "mediaFile", "/media/asset", null, null, DifferenceType.Added, null, "b", null, "media"),
        ]);

        var filtered = ComparisonResultFilter.Apply(
            source,
            new ComparisonRequest("A", "B", Culture: "sv-SE", ContentType: "home", PathContains: "/site"));

        Assert.Single(filtered.Items);
        Assert.Equal("2", filtered.Items[0].Id);
    }

    [Fact]
    public void Apply_KeepsRowsWithoutCultureWhenCultureFilterSet()
    {
        var source = ComparisonResult.FromItems(
        [
            new ComparisonItem("1", "Settings", "Language", null, null, null, DifferenceType.Identical, "a", "a", null, "settings"),
            new ComparisonItem("2", "Page", "home", "/home", "en-US", null, DifferenceType.Modified, "a", "b", null, "content"),
        ]);

        var filtered = ComparisonResultFilter.Apply(
            source,
            new ComparisonRequest("A", "B", Culture: "en-US"));

        Assert.Equal(2, filtered.Items.Count);
    }
}
