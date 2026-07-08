import { manifests as entrypoints } from "./entrypoints/manifest.js";
import { manifests as dashboards } from "./dashboards/manifest.js";

/**
 * Collates all extension manifests loaded by umbraco-package.json.
 */
export const manifests: Array<UmbExtensionManifest> = [
  ...entrypoints,
  ...dashboards,
];
