import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev convenience: forward API calls to the FastAPI backend.
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
