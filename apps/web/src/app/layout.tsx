/**
 * Minimal root layout that redirects to locale-specific routes
 * This file is kept minimal as the main layout is in [locale]/layout.tsx
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
