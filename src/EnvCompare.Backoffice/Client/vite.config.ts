import { defineConfig } from "vite";

/**
 * Builds the EnvCompare backoffice bundle into the RCL static-web-assets folder.
 * Umbraco discovers `umbraco-package.json` under `/App_Plugins/EnvCompare`.
 */
export default defineConfig({
  build: {
    lib: {
      entry: "src/bundle.manifests.ts",
      formats: ["es"],
      fileName: "env-compare",
    },
    outDir: "../wwwroot/App_Plugins/EnvCompare",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [/^@umbraco/],
    },
  },
  publicDir: "public",
});
