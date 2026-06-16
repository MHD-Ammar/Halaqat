"use client";

/**
 * LocalePersistence
 *
 * Client-side guard that keeps the user's explicit language choice sticky
 * even if the `NEXT_LOCALE` cookie is cleared (e.g. by aggressive privacy
 * settings). The LanguageSwitcher mirrors every choice into localStorage;
 * this component runs on mount and, if it finds a stored locale that differs
 * from the locale in the URL while the cookie is missing, restores the
 * cookie and navigates to the stored locale.
 *
 * The default locale is Arabic (see i18n/routing.ts with localeDetection
 * disabled), so a brand-new visitor with no stored preference always lands
 * in Arabic. This component only ever acts on an *explicit* prior choice.
 *
 * Renders nothing.
 */

import Cookies from "js-cookie";
import { useLocale } from "next-intl";
import { useEffect } from "react";

import { useRouter, usePathname } from "@/i18n/routing";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const SUPPORTED = ["ar", "en"] as const;
type SupportedLocale = (typeof SUPPORTED)[number];

function isSupported(value: string | null): value is SupportedLocale {
  return value === "ar" || value === "en";
}

export function LocalePersistence() {
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_COOKIE_NAME);
    } catch {
      return; // storage unavailable — nothing to restore.
    }

    if (!isSupported(stored)) return;

    // If the cookie was lost, rewrite it from the backup so the server keeps
    // honouring the choice on subsequent navigations.
    const cookieLocale = Cookies.get(LOCALE_COOKIE_NAME);
    if (cookieLocale !== stored) {
      Cookies.set(LOCALE_COOKIE_NAME, stored, {
        expires: 30,
        sameSite: "lax",
      });
    }

    // If the URL is currently rendering a different locale than the stored
    // preference, switch to it once.
    if (stored !== activeLocale) {
      router.replace(pathname, { locale: stored });
    }
    // We intentionally run this only on mount / locale change, not on every
    // pathname change, to avoid fighting in-app navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocale]);

  return null;
}
