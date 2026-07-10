using EnvCompare.Core.Comparison.Dictionary;
using EnvCompare.Core.Comparison.Settings;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;
using EnvCompare.Tests.TestHelpers;

namespace EnvCompare.Tests.Comparison;

public sealed class SettingsComparerTests
{
    [Fact]
    public async Task CompareAsync_DetectsLanguageDifferences()
    {
        var providerA = new FakeEnvironmentProvider(
            "A",
            languages:
            [
                SnapshotBuilder.Language("en-US", "English", isDefault: true),
                SnapshotBuilder.Language("da-DK", "Danish"),
            ]);

        var providerB = new FakeEnvironmentProvider(
            "B",
            languages:
            [
                SnapshotBuilder.Language("en-US", "English (US)", isDefault: true, isMandatory: true),
                SnapshotBuilder.Language("sv-SE", "Swedish"),
            ]);

        var result = await new SettingsComparer().CompareAsync(new ComparisonContext(
            providerA,
            providerB,
            new ComparisonRequest("A", "B"),
            new EnvCompareOptions()));

        Assert.Equal(3, result.TotalCompared);
        Assert.Equal(1, result.ModifiedCount);
        Assert.Equal(1, result.MissingCount);
        Assert.Equal(1, result.AddedCount);

        Assert.Contains(result.Items, i => i.Culture == "en-US" && i.Status == DifferenceType.Modified);
        Assert.Contains(result.Items, i => i.Culture == "da-DK" && i.Status == DifferenceType.Missing);
        Assert.Contains(result.Items, i => i.Culture == "sv-SE" && i.Status == DifferenceType.Added);
    }
}

public sealed class DictionaryComparerTests
{
    [Fact]
    public async Task CompareAsync_ReturnsEmptyUntilProviderExists()
    {
        var providerA = new FakeEnvironmentProvider("A");
        var providerB = new FakeEnvironmentProvider("B");

        var result = await new DictionaryComparer().CompareAsync(new ComparisonContext(
            providerA,
            providerB,
            new ComparisonRequest("A", "B"),
            new EnvCompareOptions()));

        Assert.Same(ComparisonResult.Empty.Items, result.Items);
        Assert.Equal(0, result.TotalCompared);
    }
}
