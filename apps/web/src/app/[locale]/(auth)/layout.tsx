/**
 * Auth Layout
 *
 * Simple, centered layout for authentication pages (Login/Register).
 * Features a clean gradient background.
 */

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthLayoutContent>{children}</AuthLayoutContent>;
}

function AuthLayoutContent({ children }: { children: ReactNode }) {
  const t = useTranslations("Header");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-2xl">
                ح
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("halaqat")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("mosqueManagement")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
