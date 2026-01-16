/**
 * Dashboard Layout
 * 
 * Responsive layout with:
 * - Mobile: Header + Bottom Navigation
 * - Desktop: Sidebar Navigation
 */

import { ReactNode } from "react";
import { MainNav } from "@/components/main-nav";
import { MobileHeader } from "@/components/mobile-header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Navigation (Sidebar on desktop, Bottom nav on mobile) */}
      <MainNav />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <main className="md:pl-64">
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
