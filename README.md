# EnvCompare

Production-ready Umbraco 17 package for comparing content between Umbraco Cloud environments from the backoffice.

## Solution layout

```
EnvCompare.sln
├── src/
│   ├── EnvCompare.Core/            # Domain, abstractions, comparison models
│   ├── EnvCompare.Infrastructure/  # Environment providers, repositories, caching
│   ├── EnvCompare.Backoffice/      # Installable RCL package (API + App_Plugins)
│   └── EnvCompare.Site/            # Local Umbraco 17 host for development
└── tests/
    └── EnvCompare.Tests/           # Unit tests
```

## Development plan (step-gated)

| Step | Status | Focus |
|------|--------|--------|
| 1 | Done | Solution structure |
| 2 | Done | Package manifest / Vite packaging |
| 3 | Done | Dashboard shell |
| 4 | Done | Environment abstraction implementations |
| 5 | Done | Comparison engine |
| 6 | Done | Full backoffice UI |
| 7 | Done | Meaningful unit tests |

## Prerequisites

- .NET 10 SDK
- Node.js 20+ (Client Vite builds)
- Umbraco 17 compatible tooling

## Build

```bash
dotnet build EnvCompare.sln
```

This restores NuGet packages and builds the Backoffice Client (`npm run build`) into:

`src/EnvCompare.Backoffice/wwwroot/App_Plugins/EnvCompare/`

Skip the Client build when iterating on C# only:

```bash
dotnet build -p:SkipClientBuild=true
```

## Client (watch mode)

```bash
cd src/EnvCompare.Backoffice/Client
npm install
npm run watch
```

## Run the host site

```bash
dotnet run --project src/EnvCompare.Site
```

Package assets are served from the referenced RCL as static web assets under `/App_Plugins/EnvCompare/`.

## Dashboard (Step 3)

After building the Client, administrators see **EnvCompare** under the **Settings** section tab strip.

- Manifest alias: `EnvCompare.Dashboard.Compare`
- Conditions: Settings section + `Umb.Condition.CurrentUser.IsAdmin`
- API policy: `RequireAdminAccess` (read-only)

## Environments (Step 4)

Providers are resolved through `IEnvironmentProviderRegistry`:

- **Local** — `LocalEnvironmentProvider` (Umbraco `IContentService` / `IMediaService` / `ILanguageService`)
- **Remote** — `RemoteEnvironmentProvider` per `EnvCompare:Environments` entry (`ApiUrl` + optional Bearer `Authentication`)

Configure remotes in `appsettings.json`:

```json
"EnvCompare": {
  "Timeout": "00:02:00",
  "Environments": [
    { "Name": "Development", "ApiUrl": "https://my-project-dev.umbraco.io", "Authentication": "" }
  ]
}
```

Remote URLs should be the site root. The provider calls `umbraco/envcompare/api/v1/...` on that host (peer EnvCompare API).

## Comparison engine (Step 5)

`IComparisonEngine` orchestrates pluggable `IComparerModule` implementations:

| Module | Alias | What it compares today |
|--------|-------|-------------------------|
| Content | `content` | Keys, name, type, parent, sort, level, cultures, published |
| Media | `media` | Keys, name, type, parent, sort, filename |
| Settings | `settings` | Languages |
| Dictionary | `dictionary` | Stub (empty until dictionary provider exists) |

API: `POST /umbraco/envcompare/api/v1/compare`

Supports cancellation, progress reporting, ignore lists from config, and request filters (status/search/path/type/culture).

## Dashboard UI (Step 6)

After building the Client, the dashboard includes:

- **Git-style diff panel** — side-by-side values with added/removed highlighting
- **Virtual scrolling** — windowed rendering for large result sets
- **Tree view** — expandable hierarchy from Umbraco paths (toggle List/Tree)
- **Rich filters** — status, culture, content type, path, search, show/hide ignored
- **Instant client-side filtering** — filters apply without re-running Compare
- **Resizable diff panel** — drag the splitter between results and differences
- **Tab counts**, status icons, loading overlay, sticky toolbar/filters

## Tests (Step 7)

```bash
dotnet test
```

Coverage includes the comparison engine, all comparer modules, result filtering/aggregation, tree loading, environment registry, and cache behavior.

## Architecture notes

- Comparison engine never couples to Local vs Remote — only `IEnvironmentProvider`.
- Comparers plug in via `IComparerModule` for future extensibility (e.g. Members).
- Backoffice is the NuGet package surface; Site is development-only.
- `umbraco-package.json` registers a `bundle` that loads the Vite entry (`env-compare.js`).
