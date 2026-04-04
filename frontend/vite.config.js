import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../",
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["undifficultly-illtempered-liana.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:1234",
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, "") || "/",
      },
    },
  },
});
