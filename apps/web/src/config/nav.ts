/**
 * Navigation Items Configuration
 *
 * Centralized navigation items for both mobile bottom nav and desktop sidebar.
 * Includes role-based access control with FLATTENED route structure.
 */

import {
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
 * Routes are now FLATTENED (no /dashboard prefix)
 * Note: Landing page (/) is only for unauthenticated users
 */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    description: "Dashboard and analytics",
    roles: ["ADMIN", "SUPERVISOR", "TEACHER"],
  },
  {
    title: "Circles",
    href: "/circles",
    icon: BookOpen,
    description: "Manage study circles",
    roles: ["ADMIN"],
  },
  {
    title: "Students",
    href: "/students",
    icon: Users,
    description: "View and manage students",
    roles: ["ADMIN"],
  },
  {
    title: "My Circle",
    href: "/my-circle",
    icon: BookOpen,
    description: "Today's session and attendance",
    roles: ["TEACHER"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    description: "Your account settings",
    // Available to all authenticated users
  },
];

/**
 * Filter nav items by user role
 * Returns items that match the user's role or have no role restrictions
 */
export function getNavItemsForRole(role?: string): NavItem[] {
  // If no role, return items without role restrictions (basic items)
  if (!role) {
    return NAV_ITEMS.filter((item) => !item.roles || item.roles.length === 0);
  }

  return NAV_ITEMS.filter((item) => {
    // If no roles specified, item is available to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if user's role is in the allowed roles
    return item.roles.includes(role as UserRole);
  });
}
