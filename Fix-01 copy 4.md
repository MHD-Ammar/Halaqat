# Task 01: Architecture Repair - Routing & Navigation

**Role:** Senior Frontend Architect.
**Critical Issues Identified:**

1.  **Duplicate Route Segments:** The current structure is `app/(dashboard)/dashboard/circle`. This creates URLs like `/dashboard/dashboard/circle`.
2.  **Empty Sidebar:** The sidebar is static and doesn't show links based on the user's role.

**Requirements:**

### 1. File Structure Refactor (Action Required)

Move the folders to flatten the structure. The target structure inside `apps/web/app` MUST be:

```text
(dashboard)/
    layout.tsx      <-- Contains Sidebar & Navbar
    page.tsx        <-- Redirects: Admin -> /overview, Teacher -> /my-circle
    overview/       <-- Admin Stats
    circles/        <-- Admin Circles List (Move from dashboard/circle)
    students/       <-- Admin Students List (Move from dashboard/students)
    my-circle/      <-- Teacher View
    profile/        <-- User Profile
```
