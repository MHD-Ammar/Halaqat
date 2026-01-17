Act as a Senior Full-Stack Developer. We are building the Supervisor/Admin Dashboard. Current State: Teachers are generating data (Attendance, Points). Your Goal: Implement the Analytics API and the Admin Dashboard UI to visualize mosque performance.

Please follow these instructions strictly.

1. Backend: Analytics Service
   Create apps/api/src/analytics/analytics.service.ts.

Implement getDailyOverview():

Total Active Students: Count students where deletedAt is null.

Today's Attendance Rate:

Get all sessions for today.

Calculate: (Count of PRESENT students) / (Total Active Students assigned to circles) \* 100.

Points Awarded Today: Sum of PointTransaction.amount created today.

Active Circles: Count of circles that have a session open today.

Implement getTeacherPerformance():

Return a list of teachers with: Name, Circle Name, Last Session Date (to spot inactive teachers).

Controller: AnalyticsController (GET /analytics/overview, GET /analytics/teachers).

Security: Use @Roles(UserRole.ADMIN, UserRole.SUPERVISOR).

2. Frontend: Admin Dashboard Page
   Location: apps/web/app/(dashboard)/admin/page.tsx.

Layout: This page uses the Desktop Sidebar layout (already set up in Task 04).

3. UI Components (Shadcn/UI)
   Stats Grid:

Create 4 Cards at the top: "Total Students", "Attendance %", "Points Given", "Active Circles".

Use lucide-react icons for each (Users, Percent, Star, Activity).

Teachers Table (The Monitoring Tool):

Use Shadcn Table component (or TanStack Table if you prefer, but keep it simple).

Columns: Teacher Name, Circle, Students Count, Last Session, Status (Active/Inactive).

Logic: If Last Session was > 3 days ago, highlight the row in Red or add a "Warning" badge. This helps the supervisor follow up.

4. Integration
   Create useAdminStats custom hook (React Query) to fetch from /analytics/overview.

Handle the loading state with Skeleton cards to prevent layout shift.

Acceptance Criteria (Checklist)
[ ] GET /analytics/overview returns accurate calculated data from the DB.

[ ] The Admin Dashboard loads fast and displays the 4 key metrics.

[ ] The Teachers Table clearly shows who worked today and who didn't.

[ ] The UI is responsive (Works on iPad/Tablet for supervisors walking around).

Output: Provide:

The AnalyticsService and Controller.

The AdminDashboardPage component code.

The StatsCard reusable component.
