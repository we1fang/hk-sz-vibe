import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    // 与 immdQueue.ts 的 IMMD_DATA_PREFIX="/immd-data"、vercel.json rewrites 目标路径一致
    proxy: {
      "/immd-data": {
        target: "https://secure1.info.gov.hk",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/immd-data/, "/immd/mobileapps/2bb9ae17/data"),
      },
    },
  },
});