import type { NextConfig } from "next";

const apiBackendUrl = process.env.API_BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  // Better-sqlite3 is a native module, exclude from client bundle
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    // Naikkan batas body proxy Next.js (default bawaan hanya 10MB = 10485760 bytes!) & timeout 5 menit
    proxyClientMaxBodySize: "100mb",
    proxyTimeout: 300_000,
  },
  async redirects() {
    return [
      {
        source: "/kas/shift",
        destination: "/hrd/shift-kasir",
        permanent: true,
      },
      {
        source: "/kas/shift/laporan",
        destination: "/hrd/shift-kasir/laporan",
        permanent: true,
      },
    ];
  },
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
