Act as a Senior Full-Stack Developer. We are building the Student Profile & Progress Report. Current State: We have all the raw data (Attendance, Points, Recitations) scattered in the DB. Your Goal: Aggregate this data into a comprehensive Student Profile API and a Frontend Detail Page.

Please follow these instructions strictly.

1. Backend: Aggregation API
   Service: In StudentsService, add getStudentProfile(studentId).

Logic: Fetch the student and run parallel queries (Promise.all) to get:

Stats: Calculate Attendance Rate % (Present / Total Sessions) and Total Pages Memorized (Count of unique pages/surahs).

Recent Activity: Last 5 recitations.

Points History: Last 10 transactions.

Controller: GET /students/:id/profile.

Response DTO: { student: Student, stats: { attendanceRate, totalHifz }, recentActivity: [...], pointsHistory: [...] }.

2. Frontend: Student Detail Page
   Location: apps/web/app/(dashboard)/students/[id]/page.tsx.

Layout:

Header: Large Avatar (Placeholder or Initials), Student Name, Circle Name, and a big "Total Points" badge.

Tabs (Shadcn UI): Use Tabs, TabsList, TabsTrigger, TabsContent.

Tab 1: Overview: Shows Stats Cards (Attendance %, Hifz Count) and "Recent Activity" list.

Tab 2: Recitation Log: A full list of what they recited, grouped by date. Show "Surah", "Verses", and "Rating" (Color-coded).

Tab 3: Points Ledger: A table showing { Date | Reason | Amount (+/-) }.

Tab 4: Attendance: A simple list or calendar view of their attendance history.

3. UI Components Details
   Recitation Item: Create a component that looks like a "ticket".

Left: Surah Name.

Right: Rating Badge (e.g., "Excellent" in Green).

Subtext: Verses & Date.

Points Item:

If amount > 0: Green text (+10).

If amount < 0: Red text (-5).

4. Navigation Integration
   Update the StudentList (from Task 12 Dashboard) so that clicking on a student's name (not the toggle button) navigates to this /students/[id] page.

Acceptance Criteria (Checklist)
[ ] Clicking a student navigates to their profile.

[ ] The Profile Header shows accurate total points from the DB.

[ ] I can switch tabs to see Recitation History vs Points History.

[ ] The Attendance Rate calculation is accurate.

[ ] The UI is responsive (Tabs stack or scroll on mobile).

Output: Provide:

The Backend getStudentProfile logic.

The Frontend StudentProfilePage code.

The RecitationHistoryList component.
