import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const proxyTarget = (process.env.EVENT_CREATOR_PROXY_TARGET || "http://localhost:3001").replace(/\/+$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
