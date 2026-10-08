import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  base: "/marvel-watchverse/",
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 800 },
});
