using EnvCompare.Core.Abstractions;
using EnvCompare.Core.Configuration;

namespace EnvCompare.Core.Models;

/// <summary>
/// Shared runtime context passed to comparer modules.
/// </summary>
/// <param name="EnvironmentA">Resolved environment A provider.</param>
/// <param name="EnvironmentB">Resolved environment B provider.</param>
/// <param name="Request">Original comparison request.</param>
/// <param name="Options">Package configuration (ignored paths/types/properties).</param>
/// <param name="Progress">Optional progress reporter.</param>
public sealed record ComparisonContext(
    IEnvironmentProvider EnvironmentA,
    IEnvironmentProvider EnvironmentB,
    ComparisonRequest Request,
    EnvCompareOptions Options,
    IProgress<ComparisonProgress>? Progress = null);
