export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "EnvCompare Entrypoint",
    alias: "EnvCompare.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
