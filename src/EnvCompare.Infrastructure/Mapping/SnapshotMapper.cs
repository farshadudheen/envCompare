using EnvCompare.Core.Models;
using Umbraco.Cms.Core.Models;
using UmbracoConstants = Umbraco.Cms.Core.Constants;

namespace EnvCompare.Infrastructure.Mapping;

/// <summary>
/// Maps Umbraco entities to environment-agnostic snapshots.
/// </summary>
internal static class SnapshotMapper
{
    public static ContentNodeSnapshot ToContentSnapshot(IContent content, Guid? parentKey)
    {
        ArgumentNullException.ThrowIfNull(content);

        var cultures = content.AvailableCultures?
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c, StringComparer.OrdinalIgnoreCase)
            .ToArray()
            ?? [];

        return new ContentNodeSnapshot(
            Key: content.Key,
            Id: content.Id,
            Name: content.Name ?? string.Empty,
            ContentTypeAlias: content.ContentType.Alias,
            ParentKey: parentKey,
            Path: content.Path,
            Level: content.Level,
            SortOrder: content.SortOrder,
            Published: content.Published,
            Cultures: cultures);
    }

    public static MediaNodeSnapshot ToMediaSnapshot(IMedia media, Guid? parentKey)
    {
        ArgumentNullException.ThrowIfNull(media);

        string? fileName = null;
        if (media.HasProperty(UmbracoConstants.Conventions.Media.File))
        {
            fileName = media.GetValue<string>(UmbracoConstants.Conventions.Media.File);
        }

        return new MediaNodeSnapshot(
            Key: media.Key,
            Id: media.Id,
            Name: media.Name ?? string.Empty,
            MediaTypeAlias: media.ContentType.Alias,
            ParentKey: parentKey,
            Path: media.Path,
            Level: media.Level,
            SortOrder: media.SortOrder,
            FileName: fileName);
    }
}
