Act as a Senior Frontend Engineer & UX Designer. We are starting the UI implementation for "Halaqat" using Next.js 14 (App Router). Current State: Backend is ready. Frontend (apps/web) is a clean Next.js install. Your Goal: Setup the UI Foundation, Shadcn/UI library, and the Responsive App Layout (Mobile-First Shell).

Please follow these instructions strictly.

1. Library Setup (Shadcn/UI & Tools)
   Initialize Shadcn/UI:

Run the init command for apps/web.

Settings: Use TypeScript, Tailwind CSS, Slate as base color, and CSS Variables for theming.

Primary Color: Configure the primary color in globals.css to be a deep, elegant Emerald Green (fitting for a Mosque management context), but keep it modern.

Install Icons: Install lucide-react for consistent iconography.

Utility: Ensure clsx and tailwind-merge are setup (standard Shadcn utils).

2. Component Installation
   Install the following Shadcn components now (we will need them immediately):

button, input, card, avatar, sheet (for mobile menus), dropdown-menu, toast (for notifications).

3. The "App Shell" Layouts (Crucial UX)
   We need two distinct layouts. Create them in apps/web/app/(auth) and apps/web/app/(dashboard).

A. Auth Layout (apps/web/app/(auth)/layout.tsx)
A simple, centered layout for Login/Register pages.

Clean background (maybe a very subtle pattern or soft gradient).

B. Dashboard Layout (apps/web/app/(dashboard)/layout.tsx) - THE CORE
This layout must adapt based on screen size (Responsive):

Mobile View (< md):

Header: Simple top bar with the App Logo and a "User Avatar" on the right.

Content: The main scrollable area.

Bottom Navigation Bar (Fixed): This is critical for teachers. It must have 3-4 tabs:

Home (Dashboard)

My Circle (The core feature)

Students (List)

Profile

Styling: The bottom bar must be sticky at the bottom, have active states (colored icon), and hide on scroll if possible (optional, or just fixed).

Desktop View (>= md):

Sidebar: Replace the Bottom Bar with a permanent Left Sidebar.

Include the same links but with text labels.

This is for Supervisors/Admins who use laptops.

4. Navigation Logic
   Create a client component MainNav.tsx that handles the logic of checking the current path (usePathname) to highlight the active tab.

Define a constant NAV_ITEMS array so we can easily add menu items later.

5. Landing Page
   In apps/web/app/page.tsx, create a redirect or a simple "Get Started" button that points to /login.

Acceptance Criteria (Checklist)
[ ] Shadcn/UI is installed and components are located in apps/web/components/ui.

[ ] I can run pnpm dev and see the app.

[ ] Responsiveness Test:

On a mobile screen (simulated), I see the Bottom Navigation Bar.

On a desktop screen, I see the Sidebar.

[ ] The theme uses the Emerald Green color scheme.

[ ] The directory structure uses Next.js Route Groups (auth) and (dashboard) correctly to separate layouts.

Output: Provide the setup commands, the globals.css (with the green theme), the layout.tsx files, and the MainNav component code handling the responsive switch (Bottom Bar vs Sidebar).
