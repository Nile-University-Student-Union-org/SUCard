import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@resvg/resvg-js"],
  // Dev only: lets a phone open the local dev server through a Cloudflare quick tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
  async headers() {
    const policy = ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
      "form-action 'self'", `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`, "worker-src 'self' blob:", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:", "img-src 'self' data: blob:", "connect-src 'self' https://login.microsoftonline.com",
      "frame-src 'self'", "navigate-to 'self' https://pay.google.com https://login.microsoftonline.com"].join("; ");
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: policy },
    ];
    if (process.env.BETTER_AUTH_URL?.startsWith("https://")) headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
