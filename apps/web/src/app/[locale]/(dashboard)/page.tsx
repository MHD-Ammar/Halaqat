/**
 * Dashboard Root Page
 *
 * Redirects users to their role-specific dashboard:
 * - ADMIN/SUPERVISOR -> /overview
 * - TEACHER -> /my-circle
 * - EXAMINER -> /exams
 * - STUDENT -> /student-portal
 */

import DashboardRedirect from "./_components/dashboard-redirect";

export default function DashboardRootPage() {
  return <DashboardRedirect />;
}
