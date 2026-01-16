/**
 * Auth Layout
 * 
 * Simple, centered layout for authentication pages (Login/Register).
 * Features a clean gradient background.
 */

import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-2xl">ح</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Halaqat</h1>
              <p className="text-sm text-muted-foreground">Mosque Management</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
