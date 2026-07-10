using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Infrastructure.Migrations;

namespace EnvCompare.Infrastructure.Migrations;

/// <summary>
/// Package migration plan for EnvCompare database setup and upgrades.
/// </summary>
public sealed class EnvCompareMigrationPlan : PackageMigrationPlan
{
    /// <summary>
    /// Stable GUID for the initial migration step.
    /// </summary>
    public static readonly Guid InitialMigrationId = Guid.Parse("8f4e2c1a-9b3d-4e5f-a6c7-1d2e3f4a5b6c");

    /// <summary>
    /// Version recorded on first install.
    /// </summary>
    public const string InitialVersion = "0.1.2";

    /// <summary>
    /// Creates the migration plan.
    /// </summary>
    public EnvCompareMigrationPlan()
        : base("EnvCompare")
    {
    }

    /// <inheritdoc />
    protected override void DefinePlan()
    {
        From(string.Empty)
            .To<EnvCompareInitialMigration>(InitialMigrationId);
    }
}
