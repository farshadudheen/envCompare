# EnvCompare

Umbraco 17 NuGet package for comparing content between Umbraco Cloud environments from the backoffice.

## Install

Add the package to your Umbraco 17 site:

```xml
<PackageReference Include="EnvCompare" Version="0.17.9" />
```

The package auto-registers via `EnvCompareComposer` (`IUmbracoBuilder`). On first run, the package migration creates the `EnvComparePackageState` table to track installed version for future upgrades.

Configure remote environments in `appsettings.json`:

```json
"EnvCompare": {
  "PeerApiKey": "your-shared-secret-for-inbound-peer-calls",
  "Timeout": "00:02:00",
  "Environments": [
    {
      "Name": "Live",
      "ApiUrl": "https://my-project-live.umbraco.io",
      "Authentication": "same-as-live-PeerApiKey"
    }
  ],
  "IgnoredContentTypes": [],
  "IgnoredPaths": [],
  "IgnoredProperties": []
}
```

Remote URLs should be the site root. The provider calls `envcompare/api/v1/...` on that host (the peer site must also have EnvCompare installed).

### Umbraco Cloud secrets

| Setting | Where | Purpose |
|---------|-------|---------|
| `EnvCompare__PeerApiKey` | Each environment that receives peer calls (e.g. Live) | Protects inbound peer API |
| `EnvCompare__Environments__0__Authentication` | Calling environment (e.g. local) | Bearer token sent to remote |
| `EnvCompare__Environments__0__ApiUrl` | Calling environment | Remote site root URL |

## Build the NuGet package

Prerequisites: .NET 10 SDK, Node.js 20+ (for the backoffice Client Vite build).

```bash
dotnet pack src/EnvCompare.Backoffice/EnvCompare.Backoffice.csproj -c Release
```

Output: `artifacts/EnvCompare.0.17.9.nupkg`

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
- `POST /umbraco/management/api/v1/envcompare/compare`

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

## Troubleshooting peer API (sign-in HTML on Live)

The server-to-server peer API lives at **`/envcompare/api/v1/...`** (not under `/umbraco/`).

### Umbraco Cloud Basic Auth (Public Access)

Live/Staging on Umbraco Cloud often has **Public Access (Basic Auth)** enabled. Without bypassing it, requests receive the **Umbraco - Sign In** HTML page (`/umbraco/basic-auth/login`).

**Fixed in 0.17.8+** — peer API routes are registered with ASP.NET Core `ShortCircuit()`, which skips Umbraco Basic Auth middleware. Peer calls are protected by `EnvCompare:PeerApiKey` (Bearer token) instead.

### Verify peer API

```http
GET https://your-site.umbraco.io/envcompare/api/v1/ping
```

Expected: `Pong` (no auth required when `PeerApiKey` is empty on that site).

```http
GET https://your-site.umbraco.io/envcompare/api/v1/health
Authorization: Bearer {PeerApiKey configured on that site}
Accept: application/json
```

Expected: `{"status":"ok","package":"EnvCompare"}`.

You do **not** need `X-Authentication-Shared-Secret` for peer API calls when running **0.17.8+**.

### Legacy: BasicAuthSharedSecret (0.17.7 and earlier)

Versions before 0.17.8 required the Umbraco Basic Auth bypass header for Cloud Live/Staging:

```json
"BasicAuthSharedSecret": "Live's Umbraco:CMS:BasicAuth:SharedSecret:Value from Cloud portal"
```

Upgrade to **0.17.8** on all environments to remove this requirement.

## Troubleshooting install (NU1101)

If restore fails with **Unable to find package EnvCompare.Core** or **EnvCompare.Infrastructure**, you are using an **old** `EnvCompare` nupkg that listed those as separate NuGet dependencies. The current package bundles all three DLLs into a single `EnvCompare` package.

1. Rebuild the package from this repo:
   ```bash
   dotnet pack src/EnvCompare.Backoffice/EnvCompare.Backoffice.csproj -c Release
   ```
2. Copy `artifacts/EnvCompare.0.17.9.nupkg` to nuget.org or your feed.
3. In your Umbraco site, reference only the main package:
   ```xml
   <PackageReference Include="EnvCompare" Version="0.17.9" />
   ```
   Do **not** add `EnvCompare.Core` or `EnvCompare.Infrastructure` as separate package references.
4. Clear the NuGet cache if old metadata is still picked up:
   ```bash
   dotnet nuget locals all --clear
   ```

## Troubleshooting backoffice logout (EnvCompare screen only)

If opening **Settings → EnvCompare** logs you out immediately, the dashboard was calling a non-Management API URL without a valid bearer token. Umbraco treats the 401 as a session failure and redirects to login.

**Fixed in 0.17.3+** — backoffice calls use `/umbraco/management/api/v1/envcompare/...` with bearer auth via `umbHttpClient`.

After upgrading to `EnvCompare` **0.17.9** or later:

1. Restart the Umbraco site.
2. Hard-refresh the backoffice (Ctrl+F5) so cached `/App_Plugins/EnvCompare/` scripts reload.
3. Confirm in browser DevTools → Network that `GET /umbraco/management/api/v1/envcompare/environments` returns **200** (not 401).
