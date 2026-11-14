import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  // Windows file notifications can omit rapid edits and leave dev modules stale.
  server: { watch: process.platform === "win32" ? { usePolling: true, interval: 250 } : undefined },
});
