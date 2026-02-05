"use client";

/**
 * MainNav Component
 *
 * Responsive navigation component that renders:
 * - Bottom Navigation Bar on mobile (< md)
 * - Sidebar on desktop (>= md)
 *
 * Features role-based navigation filtering with i18n support.
 */

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getNavItemsForRole } from "@/config/nav";
import { useAuth } from "@/hooks";
import { usePathname , Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const t = useTranslations("Nav");
  const tCommon = useTranslations("Common");

  // Get nav items filtered by user role
  const navItems = getNavItemsForRole(user?.role);

  // Loading state
  if (isLoading) {
    return (
      <>
        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
          <div className="flex flex-col flex-grow bg-card border-e pt-5 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-24 ms-2" />
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Bottom Nav Skeleton */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t pb-safe">
          <div className="flex items-center justify-around h-16">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-16" />
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <div className="flex flex-col flex-grow bg-card border-e pt-5 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  ح
                </span>
              </div>
              <span className="text-xl font-semibold text-foreground">
                Halaqat
              </span>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href + item.titleKey}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t(item.titleKey)}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t p-4 space-y-3">
            {user && (
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.role}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 me-3" />
              {tCommon("logout")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar - Hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href + item.titleKey}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-xs font-medium">{t(item.titleKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
