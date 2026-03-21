import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "client",
  publicDir: "../public",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "client/index.html"),
        controller: resolve(__dirname, "client/controller.html"),
        error: resolve(__dirname, "client/error-page.html"),
      },
    },
  },
});
