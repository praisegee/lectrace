import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../lectrace/_static",
    emptyOutDir: true,
  },
  plugins: [react()],
});
