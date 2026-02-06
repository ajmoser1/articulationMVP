import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages project URL is lowercase: username.github.io/articulationmvp/
  // Override in CI with env VITE_BASE_PATH (e.g. /articulationmvp/)
  base:
    (typeof process.env.VITE_BASE_PATH === "string" && process.env.VITE_BASE_PATH) ||
    (mode === "production" ? "/articulationmvp/" : "/"),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // GitHub Pages: serve SPA for any path by copying index.html to 404.html
    mode === "production" && {
      name: "copy-404",
      closeBundle() {
        const out = path.resolve(__dirname, "dist");
        const index = path.join(out, "index.html");
        const fallback = path.join(out, "404.html");
        if (fs.existsSync(index)) {
          fs.copyFileSync(index, fallback);
        }
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
