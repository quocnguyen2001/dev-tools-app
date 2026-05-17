import type { NextConfig } from "next";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
