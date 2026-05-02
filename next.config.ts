import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@supabase/supabase-js",
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*.{woff,woff2,ttf,otf,eot}",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.{svg,png,jpg,jpeg,gif,webp,avif,ico}",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ]
  },
}

export default nextConfig
