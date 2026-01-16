import type { NextConfig } from "next";

/**
 * Next.js configuration for Halaqat Web
 *
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig: NextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Transpile shared packages
  transpilePackages: ["@halaqat/types", "@halaqat/ui"],

  // Environment variables exposed to the browser
  env: {
    API_URL: process.env.API_URL || "http://localhost:3001/api",
  },
};

export default nextConfig;
