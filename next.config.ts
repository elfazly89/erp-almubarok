import type { NextConfig } from "next";

const apiBackendUrl = process.env.API_BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  // Better-sqlite3 is a native module, exclude from client bundle
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
