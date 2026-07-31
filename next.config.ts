import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
};

export default nextConfig;
