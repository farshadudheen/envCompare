using System.Text.Json;
using EnvCompare.Core.Models;
using Umbraco.Cms.Core.Models;
using UmbracoConstants = Umbraco.Cms.Core.Constants;

namespace EnvCompare.Infrastructure.Mapping;

/// <summary>
/// Maps Umbraco entities to environment-agnostic snapshots.
/// </summary>
internal static class SnapshotMapper
{
    private static readonly JsonSerializerOptions ConfigurationJsonOptions = new()
    {
        WriteIndented = true
    };

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

    public static DictionaryItemSnapshot ToDictionarySnapshot(IDictionaryItem item)
    {
        ArgumentNullException.ThrowIfNull(item);

        var translations = item.Translations?
            .Where(t => !string.IsNullOrWhiteSpace(t.LanguageIsoCode))
            .OrderBy(t => t.LanguageIsoCode, StringComparer.OrdinalIgnoreCase)
            .Select(t => new DictionaryTranslationSnapshot(t.LanguageIsoCode, t.Value))
            .ToArray()
            ?? [];

        return new DictionaryItemSnapshot(
            item.Key,
            item.ItemKey,
            item.ParentId,
            translations);
    }

    public static DataTypeSnapshot ToDataTypeSnapshot(IDataType dataType)
    {
        ArgumentNullException.ThrowIfNull(dataType);

        return new DataTypeSnapshot(
            dataType.Key,
            dataType.Name ?? string.Empty,
            dataType.EditorAlias ?? string.Empty,
            EditorUiAlias: null,
            dataType.DatabaseType.ToString(),
            SerializeConfiguration(dataType.Configuration));
    }

    private static string SerializeConfiguration(object? configuration)
    {
        if (configuration is null)
        {
            return string.Empty;
        }

        if (configuration is IDictionary<string, object> dictionary)
        {
            if (dictionary.Count == 0)
            {
                return string.Empty;
            }

            // Sort keys so identical configs compare equal across environments.
            var ordered = dictionary
                .OrderBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase);

            return JsonSerializer.Serialize(ordered, ConfigurationJsonOptions);
        }

        return JsonSerializer.Serialize(configuration, ConfigurationJsonOptions);
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
