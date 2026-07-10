using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Comparison;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;
using EnvCompare.Tests.TestHelpers;
using Microsoft.Extensions.Options;

namespace EnvCompare.Tests.Comparison;

public sealed class ComparisonEngineTests
{
    [Fact]
    public async Task CompareAsync_RunsAllModulesAndMergesResults()
    {
        var providerA = new FakeEnvironmentProvider("A");
        var providerB = new FakeEnvironmentProvider("B");
        var registry = new FakeEnvironmentProviderRegistry(providerA, providerB);

        var moduleA = new StubComparer("content", "Content", DifferenceType.Added);
        var moduleB = new StubComparer("media", "Media", DifferenceType.Missing);

        var engine = CreateEngine(registry, moduleA, moduleB);
        var result = await engine.CompareAsync(new ComparisonRequest("A", "B"));

        Assert.Equal(2, result.TotalCompared);
        Assert.Equal(1, result.AddedCount);
        Assert.Equal(1, result.MissingCount);
        Assert.Contains(result.Items, i => i.ModuleAlias == "content");
        Assert.Contains(result.Items, i => i.ModuleAlias == "media");
    }

    [Fact]
    public async Task CompareAsync_FiltersModulesByAlias()
    {
        var registry = new FakeEnvironmentProviderRegistry(
            new FakeEnvironmentProvider("A"),
            new FakeEnvironmentProvider("B"));

        var engine = CreateEngine(
            registry,
            new StubComparer("content", "Content", DifferenceType.Identical),
            new StubComparer("media", "Media", DifferenceType.Modified));

        var result = await engine.CompareAsync(
            new ComparisonRequest("A", "B", ModuleAliases: ["media"]));

        Assert.Single(result.Items);
        Assert.Equal("media", result.Items[0].ModuleAlias);
        Assert.Equal(1, result.ModifiedCount);
    }

    [Fact]
    public async Task CompareAsync_AppliesRequestFiltersAfterMerge()
    {
        var registry = new FakeEnvironmentProviderRegistry(
            new FakeEnvironmentProvider("A"),
            new FakeEnvironmentProvider("B"));

        var engine = CreateEngine(
            registry,
            new StubComparer(
                "content",
                "Content",
                DifferenceType.Modified,
                new ComparisonItem(
                    "1",
                    "About",
                    "page",
                    "/about",
                    "en-US",
                    null,
                    DifferenceType.Modified,
                    "a",
                    "b",
                    null,
                    "content")));

        var result = await engine.CompareAsync(
            new ComparisonRequest("A", "B", Culture: "en-US", PathContains: "/about"));

        Assert.Single(result.Items);
        Assert.Equal("About", result.Items[0].Name);
    }

    [Fact]
    public async Task CompareAsync_ThrowsWhenEnvironmentsAreEqual()
    {
        var registry = new FakeEnvironmentProviderRegistry(new FakeEnvironmentProvider("Local"));
        var engine = CreateEngine(registry, new StubComparer("content", "Content", DifferenceType.Identical));

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            engine.CompareAsync(new ComparisonRequest("Local", "local")));

        Assert.Contains("different", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompareAsync_ThrowsWhenEnvironmentIsMissing()
    {
        var registry = new FakeEnvironmentProviderRegistry(new FakeEnvironmentProvider("A"));
        var engine = CreateEngine(registry, new StubComparer("content", "Content", DifferenceType.Identical));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            engine.CompareAsync(new ComparisonRequest("A", "Missing")));
    }

    [Fact]
    public async Task CompareAsync_ReportsProgress()
    {
        var registry = new FakeEnvironmentProviderRegistry(
            new FakeEnvironmentProvider("A"),
            new FakeEnvironmentProvider("B"));

        var engine = CreateEngine(
            registry,
            new StubComparer("content", "Content", DifferenceType.Identical),
            new StubComparer("media", "Media", DifferenceType.Identical));

        var reports = new List<ComparisonProgress>();
        await engine.CompareAsync(
            new ComparisonRequest("A", "B"),
            new Progress<ComparisonProgress>(reports.Add));

        Assert.Contains(reports, r => r.ModuleAlias == "content");
        Assert.Contains(reports, r => r.ModuleAlias == "media");
        Assert.Contains(reports, r => r.ModuleAlias == "engine");
    }

    [Fact]
    public async Task CompareAsync_HonoursCancellation()
    {
        var registry = new FakeEnvironmentProviderRegistry(
            new FakeEnvironmentProvider("A"),
            new FakeEnvironmentProvider("B"));

        var engine = CreateEngine(
            registry,
            new SlowComparer("content", "Content"));

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            engine.CompareAsync(new ComparisonRequest("A", "B"), cancellationToken: cts.Token));
    }

    private static ComparisonEngine CreateEngine(
        IEnvironmentProviderRegistry registry,
        params IComparerModule[] modules)
    {
        var options = Options.Create(new EnvCompareOptions());
        return new ComparisonEngine(registry, modules, new OptionsMonitorStub(options.Value));
    }

    private sealed class StubComparer(
        string alias,
        string displayName,
        DifferenceType status,
        ComparisonItem? item = null) : IComparerModule
    {
        public string Alias { get; } = alias;
        public string DisplayName { get; } = displayName;

        public Task<ComparisonResult> CompareAsync(
            ComparisonContext context,
            CancellationToken cancellationToken = default)
        {
            var row = item ?? new ComparisonItem(
                Guid.NewGuid().ToString("D"),
                displayName,
                "type",
                "/path",
                null,
                null,
                status,
                "a",
                status == DifferenceType.Added ? "b" : null,
                null,
                Alias);

            return Task.FromResult(ComparisonResult.FromItems([row]));
        }
    }

    private sealed class SlowComparer(string alias, string displayName) : IComparerModule
    {
        public string Alias { get; } = alias;
        public string DisplayName { get; } = displayName;

        public async Task<ComparisonResult> CompareAsync(
            ComparisonContext context,
            CancellationToken cancellationToken = default)
        {
            await Task.Delay(Timeout.Infinite, cancellationToken);
            return ComparisonResult.Empty;
        }
    }

    private sealed class OptionsMonitorStub(EnvCompareOptions value) : IOptionsMonitor<EnvCompareOptions>
    {
        public EnvCompareOptions CurrentValue { get; } = value;

        public EnvCompareOptions Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<EnvCompareOptions, string?> listener) => new NoopDisposable();
    }

    private sealed class NoopDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
