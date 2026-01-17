Act as a Senior Frontend Engineer. We are building the Teacher Dashboard & Attendance UI in Next.js. Current State:

Backend API /sessions/today is ready (returns session + students + attendance).

Frontend has the App Shell and Login.

We need to fetch data efficiently and display the daily class view.

Your Goal: Setup TanStack Query and build the "Today's Session" page with an interactive Attendance list.

Please follow these instructions strictly.

1. State Management Setup (React Query)
   Install: @tanstack/react-query.

Config: Create a QueryProvider component wrapping the app in apps/web/app/layout.tsx.

Why: We need robust caching and background refetching for session data.

2. API Integration (Hooks)
   Create a custom hook apps/web/hooks/use-today-session.ts:

Use useQuery to fetch from /sessions/today?circleId=....

Note: You'll need to get the circleId from the logged-in user's profile (store user in a Context or Zustand store, or just fetch profile first). For this task, assume we fetch the user profile to get the circleId.

3. The UI Components (apps/web/app/(dashboard)/dashboard/page.tsx)
   This is the Home Page for the Teacher.

Header: Show Date (e.g., "Saturday, 12 Oct") and Circle Name.

Stats Cards: Small summary (e.g., "15 Students", "12 Present").

Attendance List (The Core):

Render a list of students.

Item Layout: Avatar (left), Name (middle), Status Badge (right).

Interaction: The Status Badge should be a Button.

Logic: Clicking the button cycles the status locally: PRESENT (Green) -> ABSENT (Red) -> LATE (Yellow) -> EXCUSED (Gray) -> back to PRESENT.

Save Action:

A generic "Save Changes" floating button or fixed bottom bar.

It is disabled if no changes are made.

On click, it calls mutation.mutate() to send the BulkAttendanceDto to the backend.

4. Technical Implementation Details
   Use lucide-react icons for visual feedback (Check, X, Clock).

Handle Loading State: Use Skeleton component from Shadcn/UI to show a fake list while loading.

Handle Error State: Show a "Retry" button if the API fails.

Mobile Optimization: Ensure touch targets are at least 44px height.

Acceptance Criteria (Checklist)
[ ] React Query is configured globally.

[ ] The Dashboard loads the session automatically.

[ ] I can tap a student's status to toggle it instantly (Optimistic UI - change color immediately).

[ ] The "Save" button sends the updated list to the API.

[ ] After saving, a Success Toast appears and the data is re-fetched.

Output: Provide:

The QueryProvider setup code.

The useTodaySession hook.

The full DashboardPage component with the toggle logic.
