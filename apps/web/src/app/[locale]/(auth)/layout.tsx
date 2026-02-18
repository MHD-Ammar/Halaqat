/**
 * Auth Layout
 *
 * Simple, centered layout for authentication pages (Login/Register).
 * Features a clean gradient background.
 */

import { setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";

import { Logo } from "@/components/logo";

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Logo width={48} height={48} />
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
