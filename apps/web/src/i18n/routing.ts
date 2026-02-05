/**
 * i18n Routing Configuration
 *
 * Defines routing config for next-intl navigation.
 */

import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

// Lightweight wrappers around Next.js navigation APIs
// that handle locale prefixing automatically
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
