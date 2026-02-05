import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";

/**
 * Font configurations using Next.js font optimization
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * Metadata for SEO and social sharing
 */
export const metadata: Metadata = {
  title: "Halaqat - Mosque Management System",
  description:
    "A comprehensive system for managing mosque Halaqat (study circles), teachers, students, and attendance.",
  keywords: [
    "mosque",
    "halaqat",
    "islamic",
    "education",
    "quran",
    "management",
  ],
  authors: [{ name: "Halaqat Team" }],
};

/**
 * Viewport configuration for mobile-first design
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

/**
 * Generate static params for all supported locales
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Root Layout Component with Locale Support
 *
 * This is the root layout for the entire application.
 * It provides the HTML structure, global styles, and i18n context.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "ar" | "en")) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  // Determine text direction based on locale
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Choose font based on locale
  const fontClass =
    locale === "ar"
      ? `${cairo.variable} font-cairo`
      : `${geistSans.variable} ${geistMono.variable}`;

  return (
    <html lang={locale} dir={dir}>
      <body className={`${fontClass} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
