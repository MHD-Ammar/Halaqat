import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Create the next-intl plugin
 */
const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/**
 * Next.js configuration for Halaqat Web
 *
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig: NextConfig = {
  /**
   * Output mode for Next.js.
   * Standalone mode is enabled via environment variable for production/CI/Linux environments
   * to avoid EPERM symlink errors on Windows dev machines.
   */
  output: process.env.STANDALONE === "true" ? "standalone" : undefined,

  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Transpile shared packages
  transpilePackages: ["@halaqat/types", "@halaqat/ui"],

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  },
};

export default withNextIntl(nextConfig);
