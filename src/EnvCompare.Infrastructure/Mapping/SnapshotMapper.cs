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
            Cultures: cultures,
            Properties: PropertyValueSerializer.ExtractContentProperties(content));
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
            FileName: fileName,
            Properties: PropertyValueSerializer.ExtractMediaProperties(media));
    }

    public static ContentTypeSnapshot ToContentTypeSnapshot(IContentType contentType)
    {
        ArgumentNullException.ThrowIfNull(contentType);
        return MapContentType(
            contentType.Key,
            contentType.Alias,
            contentType.Name,
            contentType.Icon,
            contentType.IsElement,
            contentType.ContentTypeComposition,
            contentType.PropertyTypes);
    }

    public static ContentTypeSnapshot ToContentTypeSnapshot(IMediaType mediaType)
    {
        ArgumentNullException.ThrowIfNull(mediaType);
        return MapContentType(
            mediaType.Key,
            mediaType.Alias,
            mediaType.Name,
            mediaType.Icon,
            isElement: false,
            mediaType.ContentTypeComposition,
            mediaType.PropertyTypes);
    }

    private static ContentTypeSnapshot MapContentType(
        Guid key,
        string alias,
        string? name,
        string? icon,
        bool isElement,
        IEnumerable<IContentTypeComposition> compositions,
        IEnumerable<IPropertyType> propertyTypes)
    {
        var compositionAliases = compositions
            .Select(c => c.Alias)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(a => a, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var properties = propertyTypes
            .OrderBy(p => p.SortOrder)
            .Select(p => new ContentTypePropertySnapshot(
                p.Alias,
                p.Name ?? string.Empty,
                p.DataTypeKey.ToString("D"),
                p.Mandatory,
                p.SortOrder,
                p.Variations.ToString()))
            .ToArray();

        return new ContentTypeSnapshot(
            key,
            alias,
            name ?? string.Empty,
            icon,
            isElement,
            compositionAliases,
            properties);
    }
}
