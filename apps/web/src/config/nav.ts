/**
 * Navigation Items Configuration
 * 
 * Centralized navigation items for both mobile bottom nav and desktop sidebar.
 */

import {
  Home,
  Users,
  BookOpen,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    description: "Overview and quick actions",
  },
  {
    title: "My Circle",
    href: "/dashboard/circle",
    icon: BookOpen,
    description: "Manage your Halaqat",
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: Users,
    description: "View and manage students",
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
    description: "Your account settings",
  },
];
