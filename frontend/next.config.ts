import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "map-tiles",
          expiration: {
            maxEntries: 250, // Cache recent tiles without blowing up storage
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      {
        urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/i, // Common fallback
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "carto-tiles",
          expiration: {
            maxEntries: 250,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      }
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
