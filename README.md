# EnvCompare

Umbraco 17 NuGet package for comparing content between Umbraco Cloud environments from the backoffice.

## Install

Add the package to your Umbraco 17 site:

```xml
<PackageReference Include="EnvCompare" Version="0.1.0" />
```

The package auto-registers via `EnvCompareComposer` (`IUmbracoBuilder`). On first run, the package migration creates the `EnvComparePackageState` table to track installed version for future upgrades.

Configure remote environments in `appsettings.json`:

```json
"EnvCompare": {
  "Timeout": "00:02:00",
  "Environments": [
    { "Name": "Development", "ApiUrl": "https://my-project-dev.umbraco.io", "Authentication": "" }
  ],
  "IgnoredContentTypes": [],
  "IgnoredPaths": [],
  "IgnoredProperties": []
}
```

Remote URLs should be the site root. The provider calls `umbraco/envcompare/api/v1/...` on that host (the peer site must also have EnvCompare installed).

## Build the NuGet package

Prerequisites: .NET 10 SDK, Node.js 20+ (for the backoffice Client Vite build).

```bash
dotnet pack src/EnvCompare.Backoffice/EnvCompare.Backoffice.csproj -c Release
```

Output: `artifacts/EnvCompare.0.1.0.nupkg`

Skip the Client build when iterating on C# only:

```bash
dotnet pack src/EnvCompare.Backoffice/EnvCompare.Backoffice.csproj -c Release -p:SkipClientBuild=true
```

## Solution layout

```
EnvCompare.sln
└── src/
    ├── EnvCompare.Core/            # Domain, abstractions, comparison engine
    ├── EnvCompare.Infrastructure/  # Providers, caching, migrations
    └── EnvCompare.Backoffice/      # Installable RCL (API + App_Plugins) — this is the NuGet package
```

## Features

- Compare Local ↔ Development ↔ Staging ↔ Production (any configured pair)
- Modules: content, media, settings (languages), dictionary (stub)
- Read-only, admin-only backoffice dashboard under **Settings → EnvCompare**
- Git-style diff panel, virtual scrolling, tree view, rich filters
- `POST /umbraco/envcompare/api/v1/compare`

## Client development

```bash
cd src/EnvCompare.Backoffice/Client
npm install
npm run watch
```

Assets emit to `src/EnvCompare.Backoffice/wwwroot/App_Plugins/EnvCompare/`.

## Migrations

| Step | Migration | Purpose |
|------|-----------|---------|
| `8f4e2c1a-…` | `EnvCompareInitialMigration` | Creates `EnvComparePackageState` and records install version |

Future package versions add new steps to `EnvCompareMigrationPlan`.
