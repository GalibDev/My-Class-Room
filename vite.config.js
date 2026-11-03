import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icons/*.png", "favicon.svg"],
      manifest: {
        id: "/",
        name: "My Class Room",
        short_name: "Class Room",
        description:
          "Your classroom attendance, subjects and weekly routine in one place.",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#fbf9ff",
        theme_color: "#8429df",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        // Cache only the built app shell; Firebase responses are never intercepted.
      },
    }),
  ],
  server: { host: "127.0.0.1" },
});
