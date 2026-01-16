import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

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

/**
 * Metadata for SEO and social sharing
 */
export const metadata: Metadata = {
  title: "Halaqat - Mosque Management System",
  description:
    "A comprehensive system for managing mosque Halaqat (study circles), teachers, students, and attendance.",
  keywords: ["mosque", "halaqat", "islamic", "education", "quran", "management"],
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
 * Root Layout Component
 *
 * This is the root layout for the entire application.
 * It provides the HTML structure and global styles.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
