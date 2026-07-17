# CloudLens
Inspect your Umbraco Cloud environments before every deployment.

## Install

Add the package to your Umbraco 17 site:

```xml
<PackageReference Include="CloudLens" Version="1.17.2" />
```

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

Remote URLs should be the site root. The provider calls `envcompare/api/v1/...` on that host (the peer site must also have CloudLens installed).

### Umbraco Cloud secrets

| Setting | Where | Purpose |
|---------|-------|---------|
| `EnvCompare__PeerApiKey` | Each environment that receives peer calls (e.g. Live) | Protects inbound peer API |
| `EnvCompare__Environments__0__Authentication` | Calling environment (e.g. local) | Bearer token sent to remote |
| `EnvCompare__Environments__0__ApiUrl` | Calling environment | Remote site root URL |


## Features

- Compare Local ↔ Development ↔ Staging ↔ Production (any configured pair)
- Modules: content, media, settings (languages), dictionary (stub)
- Read-only, admin-only backoffice dashboard under **Settings → CloudLens**
- Git-style diff panel, virtual scrolling, tree view, rich filters

