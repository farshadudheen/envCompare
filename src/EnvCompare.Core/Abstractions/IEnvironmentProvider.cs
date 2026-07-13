using EnvCompare.Core.Models;

namespace EnvCompare.Core.Abstractions;

/// <summary>
/// Abstraction over a content source (local site, remote Cloud environment, etc.).
/// The comparison engine must never know where data originates.
/// </summary>
public interface IEnvironmentProvider
{
    /// <summary>
    /// Gets the logical name of the environment (for example, Local, Development, Staging, Production).
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets a value indicating whether this provider represents the currently running site.
    /// </summary>
    bool IsLocal { get; }

    /// <summary>
    /// Resolves environment metadata used for UI and audit.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    Task<EnvironmentDescriptor> GetDescriptorAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Tests connectivity (especially important for remote providers).
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a paged content tree listing.
    /// </summary>
    Task<EnvironmentPagedResult<ContentNodeSnapshot>> GetContentAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single content node by key.
    /// </summary>
    Task<ContentNodeSnapshot?> GetContentByKeyAsync(
        Guid key,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a paged media tree listing.
    /// </summary>
    Task<EnvironmentPagedResult<MediaNodeSnapshot>> GetMediaAsync(
        TreeQuery query,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single media node by key.
    /// </summary>
    Task<MediaNodeSnapshot?> GetMediaByKeyAsync(
        Guid key,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets languages configured in the environment.
    /// </summary>
    Task<IReadOnlyList<LanguageSnapshot>> GetLanguagesAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets document type definitions in the environment.
    /// </summary>
    Task<IReadOnlyList<ContentTypeSnapshot>> GetDocumentTypesAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets media type definitions in the environment.
    /// </summary>
    Task<IReadOnlyList<ContentTypeSnapshot>> GetMediaTypesAsync(
        CancellationToken cancellationToken = default);
}
