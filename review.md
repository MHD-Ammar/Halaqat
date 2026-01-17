Task: Comprehensive System Audit, Refactoring & Integration Fixes
Role: Act as a Lead Full-Stack Architect. We are pausing new feature development to fix structural and functional gaps in the current "Halaqat" codebase. Context: We have gone through Tasks 01 to 15. The Backend is mostly solid, but the Frontend (apps/web) is fragmented, structurally incorrect, and functionally incomplete.

Current Critical Issues:

Broken Routing: Routes are nested incorrectly (e.g., dashboard/dashboard/circle).

Dead UI: "Create Circle" and "Add Student" buttons exist visually but do nothing (no API integration).

Missing Auth Logic: No "Logout" button. No Role-Based Access Control (RBAC) in the UI (Teachers see Admin buttons).

Incomplete Business Logic: The Teacher's "Daily Session" flow is disconnected.

Your Goal: Perform a full Gap Analysis against the requirements and Refactor/Implement the missing pieces immediately.

Phase 1: Structural Refactoring (Next.js App Router)
The current folder structure inside app is messy. Refactor it to this strict structure:

Plaintext
apps/web/app/
├── (auth)
│ ├── login/page.tsx
│ └── layout.tsx
├── (dashboard) # Group for protected routes
│ ├── layout.tsx # Contains the Sidebar/Navbar + QueryProvider
│ ├── page.tsx # Redirects based on Role (Admin-> /overview, Teacher-> /my-circle)
│ ├── overview/ # Admin Dashboard (Stats)
│ ├── circles/ # Admin Circle Management
│ ├── students/ # Global Student List (Admin View)
│ ├── my-circle/ # Teacher's Daily View (Critical)
│ └── profile/ # User Profile
└── api/auth/[...nextauth] # Or your custom auth API route
Action: Move files to match this structure. Ensure layout.tsx in (dashboard) checks for the Token; if missing, redirect to /login.

Phase 2: Auth State & Navigation (Global Store)
We need a robust way to handle "Who is logged in".

Create useUser Hook: A custom hook (using Zustand or React Context) that decodes the JWT token to get { userId, role, name, mosqueId }.

Sidebar Logic:

If role === 'ADMIN': Show [Overview, Circles, Students, Teachers].

If role === 'TEACHER': Show [My Circle, My Profile].

Logout Feature: Implement a Logout button in the Sidebar/MobileMenu that:

Removes the Cookie/Token.

Clears the State.

Redirects to /login.

Phase 3: Wiring the "Dead" Buttons (CRUD Integration)
You must implement the logic for the following buttons using TanStack Query Mutations and Shadcn Dialogs:

A. Circles Management (/circles)
The Page: Fetch list of circles using useQuery.

The "Add Circle" Button:

Open a Dialog with a form (Name, Assign Teacher).

On Submit: Call POST /circles.

On Success: Invalidate query ['circles'] to refresh the list instantly.

B. Student Management (/students)
The Page: Fetch all students (paginated).

The "Add Student" Button:

Open a Dialog.

Critical UX: Include a "Select Circle" dropdown (populated from API).

On Submit: Call POST /students.

Phase 4: The Teacher's Core Workflow (/my-circle)
This is the most important part of the business logic.

Auto-Redirect: If a Teacher logs in, they should land here.

Logic:

Call GET /sessions/today.

If 404/Empty: Show a "Start Session" button (or auto-create as per Task 10).

The List: Render the Student List with Attendance Toggles working (connected to API).

Recitation Action: Clicking a student MUST open the Recitation Sheet (Task 13). Ensure this sheet actually submits data to POST /recitations.

Deliverables (Code Required)
Do not just provide a plan. Provide the corrected code for:

The (dashboard)/layout.tsx (handling Auth check & Sidebar).

The Sidebar component (handling Role filtering & Logout).

The CirclesPage (apps/web/app/(dashboard)/circles/page.tsx) with the working Create Dialog.

The StudentsPage with the working Add Student Dialog.

The MyCirclePage showing the integration of Session + Attendance + Recitation.

Constraints:

Use lucide-react for icons.

Ensure all API calls use the api instance (Axios) with the Bearer token interceptor.

Strictly adhere to the ADMIN vs TEACHER view separation.
