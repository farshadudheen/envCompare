namespace EnvCompare.Core.Models;

/// <summary>
/// Request for a paged tree listing under a parent (null/empty parent = roots).
/// </summary>
/// <param name="ParentKey">Parent node key; null means root level.</param>
/// <param name="Skip">Number of items to skip.</param>
/// <param name="Take">Page size.</param>
/// <param name="Culture">Optional culture filter for variant-aware consumers.</param>
public sealed record TreeQuery(
    Guid? ParentKey,
    int Skip = 0,
    int Take = 50,
    string? Culture = null);
