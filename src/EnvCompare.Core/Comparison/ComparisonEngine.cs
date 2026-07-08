using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Configuration;
using EnvCompare.Core.Models;
using Microsoft.Extensions.Options;

namespace EnvCompare.Core.Comparison;

/// <summary>
/// Orchestrates registered <see cref="IComparerModule"/> implementations with progress and cancellation.
/// </summary>
public sealed class ComparisonEngine : IComparisonEngine
{
    private readonly IEnvironmentProviderRegistry _registry;
    private readonly IEnumerable<IComparerModule> _modules;
    private readonly IOptionsMonitor<EnvCompareOptions> _options;

    /// <summary>
    /// Creates the comparison engine.
    /// </summary>
    public ComparisonEngine(
        IEnvironmentProviderRegistry registry,
        IEnumerable<IComparerModule> modules,
        IOptionsMonitor<EnvCompareOptions> options)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        _modules = modules ?? throw new ArgumentNullException(nameof(modules));
        _options = options ?? throw new ArgumentNullException(nameof(options));
    }

    /// <inheritdoc />
    public async Task<ComparisonResult> CompareAsync(
        ComparisonRequest request,
        IProgress<ComparisonProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.EnvironmentA) ||
            string.IsNullOrWhiteSpace(request.EnvironmentB))
        {
            throw new ArgumentException("Environment A and B are required.", nameof(request));
        }

        if (string.Equals(request.EnvironmentA, request.EnvironmentB, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Environment A and B must be different.", nameof(request));
        }

        var providerA = _registry.GetByName(request.EnvironmentA)
            ?? throw new InvalidOperationException($"Environment '{request.EnvironmentA}' was not found.");
        var providerB = _registry.GetByName(request.EnvironmentB)
            ?? throw new InvalidOperationException($"Environment '{request.EnvironmentB}' was not found.");

        var modules = SelectModules(request.ModuleAliases).ToArray();
        if (modules.Length == 0)
        {
            throw new InvalidOperationException("No comparer modules are registered or matched the request.");
        }

        var context = new ComparisonContext(
            providerA,
            providerB,
            request,
            _options.CurrentValue,
            progress);

        var moduleResults = new List<ComparisonResult>(modules.Length);
        for (var i = 0; i < modules.Length; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var module = modules[i];
            progress?.Report(new ComparisonProgress(
                module.Alias,
                i,
                modules.Length,
                $"Running {module.DisplayName}…"));

            var result = await module.CompareAsync(context, cancellationToken).ConfigureAwait(false);
            moduleResults.Add(result);
        }

        var merged = ComparisonResult.Merge(moduleResults);
        var filtered = ComparisonResultFilter.Apply(merged, request);

        progress?.Report(new ComparisonProgress(
            "engine",
            filtered.TotalCompared,
            filtered.TotalCompared,
            "Comparison complete."));

        return filtered;
    }

    private IEnumerable<IComparerModule> SelectModules(IReadOnlyList<string>? aliases)
    {
        if (aliases is null || aliases.Count == 0)
        {
            return _modules;
        }

        var set = new HashSet<string>(aliases.Where(a => !string.IsNullOrWhiteSpace(a)), StringComparer.OrdinalIgnoreCase);
        return _modules.Where(m => set.Contains(m.Alias));
    }
}
