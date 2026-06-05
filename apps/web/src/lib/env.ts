/**
 * Environment Variable Validation
 *
 * Single source of truth for all `process.env` access in the web app.
 * Validated at startup with Zod so misconfigured deployments fail fast
 * instead of silently serving broken pages.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const url = env.NEXT_PUBLIC_API_URL;
 *
 * Rule: NO file in apps/web/src/ may read `process.env` directly — only
 * this module is permitted to do so.
 */

import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .default("http://localhost:3001/api"),
  NEXT_PUBLIC_QURANI_HUB_URL: z.string().url().optional(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["ar", "en"]).default("ar"),
  NEXT_PUBLIC_VAPID_KEY: z.string().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL:          process.env["NEXT_PUBLIC_API_URL"],
  NEXT_PUBLIC_QURANI_HUB_URL:   process.env["NEXT_PUBLIC_QURANI_HUB_URL"],
  NEXT_PUBLIC_DEFAULT_LOCALE:   process.env["NEXT_PUBLIC_DEFAULT_LOCALE"],
  NEXT_PUBLIC_VAPID_KEY:        process.env["NEXT_PUBLIC_VAPID_KEY"],
});

if (!parsed.success) {
  // Fail fast in development; log in production (env may be injected at runtime)
  // eslint-disable-next-line no-console
  console.error("[env] Invalid environment variables:", parsed.error.flatten());
  if (process.env["NODE_ENV"] !== "production") {
    throw new Error(`[env] Invalid environment variables:\n${JSON.stringify(parsed.error.flatten(), null, 2)}`);
  }
}

export const env = parsed.success ? parsed.data : schema.parse({});
