import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "client",
  build: {
    outDir: "../dist/public",
    sourcemap: false,
    rollupOptions: {
      // C'est ici qu'on déclare tes multiples pages HTML
      input: {
        main: resolve(__dirname, "client/index.html"),
        controller: resolve(__dirname, "client/controller.html"),
        error: resolve(__dirname, "client/error-page.html"),
      },
    },
  },
});
