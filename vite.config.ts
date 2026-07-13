import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js powers the complete interactive market scene. Its production
    // bundle is about 721 kB minified / 195 kB gzip, so use a budget that
    // reflects the intentional renderer payload instead of Vite's generic
    // 500 kB warning threshold.
    chunkSizeWarningLimit: 750,
  },
  server: {
    port: 3000,
  },
});
