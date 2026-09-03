import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(appRoot, "../../src"),
    },
  },
  ssr: {
    noExternal: true,
  },
  build: {
    ssr: resolve(appRoot, "worker.ts"),
    outDir: resolve(appRoot, "dist/worker"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["cloudflare:workers"],
      output: {
        entryFileNames: "index.js",
        format: "es",
      },
    },
  },
});
