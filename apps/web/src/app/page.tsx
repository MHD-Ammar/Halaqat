/**
 * Home Page - Halaqat System
 *
 * This is the main landing page for the Halaqat Mosque Management System.
 * Designed with a mobile-first approach.
 */

import { UserRole } from "@halaqat/types";

/**
 * Display the available user roles from the shared types package
 * This demonstrates the type integration between web and shared packages
 */
function RolesList() {
  const roles = Object.values(UserRole);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {roles.map((role) => (
        <span
          key={role}
          className="px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 rounded-full"
        >
          {role}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        {/* Logo/Icon Placeholder */}
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
          <svg
            className="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            حَلَقات
          </h1>
          <p className="text-xl md:text-2xl font-medium text-primary-600 dark:text-primary-400">
            Halaqat System
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          Mobile First
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          نظام إدارة الحلقات
        </div>

        {/* User Roles Section */}
        <div className="pt-8 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Available Roles (from @halaqat/types)
          </h2>
          <RolesList />
        </div>

        {/* Version Info */}
        <p className="pt-8 text-sm text-gray-400 dark:text-gray-500">
          v1.0.0 • Built with Next.js & TurboRepo
        </p>
      </div>
    </main>
  );
}
