import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Add next-pwa config for service worker
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
