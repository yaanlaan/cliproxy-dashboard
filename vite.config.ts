import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 12345,
    proxy: {
      "/v0": {
        target: "http://127.0.0.1:8317",
        changeOrigin: true,
      },
      "/v1": {
        target: "http://127.0.0.1:8317",
        changeOrigin: true,
      },
      "/healthz": {
        target: "http://127.0.0.1:8317",
        changeOrigin: true,
      },
    },
  },
});
