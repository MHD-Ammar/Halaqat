"use client";

import { motion } from "framer-motion";
import { ClipboardList, Home, Medal, Trophy } from "lucide-react";

import { Link, usePathname } from "@/i18n/routing";

export function StudentBottomNav() {
  const pathname = usePathname(); // e.g., "/student-portal" or "/student-portal/quests"

  const navItems = [
    {
      label: "الرئيسية",
      href: "/student-portal",
      icon: Home,
      // For exact root match
      isActive: pathname === "/student-portal" || pathname === "/student-portal/",
    },
    {
      label: "المهام",
      href: "/student-portal/quests",
      icon: ClipboardList,
      isActive: pathname.startsWith("/student-portal/quests"),
    },
    {
      label: "الترتيب",
      href: "/student-portal/leaderboard",
      icon: Trophy,
      isActive: pathname.startsWith("/student-portal/leaderboard"),
    },
    {
      label: "الإنجازات",
      href: "/student-portal/achievements",
      icon: Medal,
      isActive: pathname.startsWith("/student-portal/achievements"),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = item.isActive;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : "opacity-70"
                  }`}
                />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </motion.div>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-[1px] w-8 h-[2px] bg-primary rounded-b-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
