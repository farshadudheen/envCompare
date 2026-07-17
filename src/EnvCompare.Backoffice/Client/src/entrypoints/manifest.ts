export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "CloudLens Entrypoint",
    alias: "EnvCompare.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
