import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const { GITHUB_PAGES } = loadEnv(mode, ".", "GITHUB_PAGES");

  return {
    base: GITHUB_PAGES === "true" ? "/kms_ai_Live/" : "/",
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
    },
    optimizeDeps: {
      include: ["blockly"],
    },
  };
});
