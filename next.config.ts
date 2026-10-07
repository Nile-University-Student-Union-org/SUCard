import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  // Dev only: lets a phone open the local dev server through a Cloudflare quick tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
