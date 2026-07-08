# Client (Vite + Lit)

TypeScript sources for the EnvCompare backoffice UI. Built assets are emitted to:

`../wwwroot/App_Plugins/EnvCompare/`

Umbraco loads `umbraco-package.json` from that folder (via RCL static web assets).

## Scripts

```bash
npm install
npm run build    # one-shot build into wwwroot
npm run watch    # rebuild on change
```

`dotnet build` on `EnvCompare.Backoffice` runs `npm install` (when needed) and `npm run build` unless you pass `-p:SkipClientBuild=true`.

## Layout

| Path | Role |
|------|------|
| `public/umbraco-package.json` | Package manifest (copied to outDir) |
| `src/bundle.manifests.ts` | Vite lib entry — registers extension manifests |
| `src/entrypoints/` | `backofficeEntryPoint` loader |
| `src/api/` | Generated OpenAPI client (used from Step 3+) |

## Dashboard (Step 3)

| Path | Role |
|------|------|
| `src/dashboards/envcompare-dashboard.element.ts` | Lit shell (env selectors, progress, tabs, panels) |
| `src/dashboards/manifest.ts` | Dashboard registration (Settings + admin-only) |

Full comparison UI: Step 6.
