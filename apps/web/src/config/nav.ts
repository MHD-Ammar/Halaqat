/**
 * Navigation Items Configuration
 *
 * Centralized navigation items for both mobile bottom nav and desktop sidebar.
 * Includes role-based access control.
 */

import {
  Home,
  Users,
  BookOpen,
  User,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "ADMIN" | "TEACHER" | "SUPERVISOR";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Roles allowed to see this nav item. If empty/undefined, all roles can see it */
  roles?: UserRole[];
}

/**
 * All navigation items with role requirements
 */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    description: "Today's session and overview",
    // Available to all authenticated users
  },
  {
    title: "Admin",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Admin dashboard and analytics",
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    title: "Circles",
    href: "/dashboard/circle",
    icon: BookOpen,
    description: "Manage study circles",
    roles: ["ADMIN"],
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: Users,
    description: "View and manage students",
    roles: ["ADMIN"],
  },
  {
    title: "My Circle",
    href: "/dashboard/circle",
    icon: BookOpen,
    description: "My assigned circle",
    roles: ["TEACHER"],
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
    description: "Your account settings",
    // Available to all authenticated users
  },
];

/**
 * Filter nav items by user role
 */
export function getNavItemsForRole(role?: string): NavItem[] {
  if (!role) return [];

  return NAV_ITEMS.filter((item) => {
    // If no roles specified, item is available to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if user's role is in the allowed roles
    return item.roles.includes(role as UserRole);
  });
}
