/**
 * i18n Configuration
 *
 * Configuration for next-intl with locale-specific message loading.
 */

import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["ar", "en"] as const;
export const defaultLocale = "ar" as const;
export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request or use default
  let locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    // Try to get from cookie
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    locale =
      cookieLocale && locales.includes(cookieLocale as Locale)
        ? cookieLocale
        : defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
