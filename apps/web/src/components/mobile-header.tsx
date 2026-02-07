"use client";

/**
 * Mobile Header Component
 *
 * Simple top bar for mobile view with logo, language switcher, user avatar, and logout.
 */

import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks";
import { useRouter } from "@/i18n/routing";

/**
 * Get initials from name
 */
function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MobileHeader() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const t = useTranslations("Common");

  const handleLogout = () => {
    logout();
  };

  const handleSettings = () => {
    router.push("/profile");
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-card border-b">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">ح</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Halaqat</span>
        </div>

        {/* Right side: Language Switcher + User Avatar */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {isLoading ? t("loading") : user?.name || t("myAccount")}
                {user?.email && (
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSettings}>
                <User className="mr-2 h-4 w-4" />
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
