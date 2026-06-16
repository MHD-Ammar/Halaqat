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
  // Always default to Arabic regardless of the visitor's browser language.
  // next-intl otherwise inspects the `Accept-Language` header and would send
  // non-Arabic browsers to English. A returning user's explicit choice is
  // still honoured because the LanguageSwitcher writes the `NEXT_LOCALE`
  // cookie, which next-intl reads with higher priority than this default.
  localeDetection: false,
});

// Lightweight wrappers around Next.js navigation APIs
// that handle locale prefixing automatically
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
