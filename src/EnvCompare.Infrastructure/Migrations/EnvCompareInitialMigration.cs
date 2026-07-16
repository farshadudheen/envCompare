using Umbraco.Cms.Infrastructure.Migrations;

namespace EnvCompare.Infrastructure.Migrations;

/// <summary>
/// Creates package state storage used by future EnvCompare upgrade migrations.
/// </summary>
public sealed class EnvCompareInitialMigration : MigrationBase
{
    private const string TableName = "EnvComparePackageState";

    /// <summary>
    /// Creates the migration.
    /// </summary>
    public EnvCompareInitialMigration(IMigrationContext context)
        : base(context)
    {
    }

    /// <inheritdoc />
    protected override void Migrate()
    {
        if (TableExists(TableName) == false)
        {
            Create.Table(TableName)
                .WithColumn("Id").AsInt32().NotNullable().Identity().PrimaryKey("PK_EnvComparePackageState")
                .WithColumn("InstalledVersion").AsString(32).NotNullable()
                .WithColumn("InstalledUtc").AsDateTime().NotNullable()
                .Do();
        }

        var count = Database.ExecuteScalar<int>($"SELECT COUNT(*) FROM {TableName}");
        if (count == 0)
        {
            Database.Execute(
                $"INSERT INTO {TableName} (InstalledVersion, InstalledUtc) VALUES (@0, @1)",
                EnvCompareMigrationPlan.InitialVersion,
                DateTime.UtcNow);
        }
    }
}
