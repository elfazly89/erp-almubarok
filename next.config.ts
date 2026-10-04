import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Better-sqlite3 is a native module, exclude from client bundle
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
