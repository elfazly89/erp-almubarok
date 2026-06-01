import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Better-sqlite3 is a native module, exclude from client bundle
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
