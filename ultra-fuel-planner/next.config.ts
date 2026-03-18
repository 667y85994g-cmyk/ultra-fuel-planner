import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Google's favicon bot hits /favicon.ico directly — rewrite to the
        // dynamically generated icon so it never gets a 404.
        source: "/favicon.ico",
        destination: "/icon",
      },
    ];
  },
};

export default nextConfig;
