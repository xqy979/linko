import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        popup: resolve(__dirname, "popup.html"),
      },
    },
  },
  server: {
    proxy: {
      // 新浪财经 roll news API
      "/api/sina": {
        target: "https://feed.mix.sina.com.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sina/, ""),
        headers: {
          Referer: "https://finance.sina.com.cn/",
        },
      },
      // 东方财富 stock announcements API
      "/api/eastmoney": {
        target: "https://np-anotice-stock.eastmoney.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoney/, ""),
        headers: {
          Referer: "https://www.eastmoney.com/",
        },
      },
    },
  },
});
