Act as a Full-Stack Engineer. We are connecting the Next.js Frontend (apps/web) to the NestJS Backend (apps/api). Current State:

Backend is running on port 3001 (Auth endpoints ready).

Frontend is running on port 3000 (Shadcn UI ready).

We have a Login page layout in apps/web/app/(auth)/login/page.tsx.

Your Goal: Implement the Login Logic, Client-side Validation, and Next.js Middleware for route protection.

Please follow these instructions strictly.

1. Backend Prep (CORS Check)
   Constraint: Since we are running on different ports, ensure the NestJS app (main.ts) has CORS enabled.

Action: Provide the code snippet to enable CORS in apps/api/src/main.ts allowing origin: 'http://localhost:3000'.

2. Frontend: API & State Management
   Library: Install axios (for API requests) and js-cookie (for managing tokens) + @types/js-cookie.

API Client: Create apps/web/lib/api.ts.

Create an axios instance with baseURL: process.env.NEXT_PUBLIC_API_URL (default to localhost:3001).

Add an Interceptor that automatically adds the Authorization: Bearer <token> header to every request if the token exists in cookies.

Auth Service: Create apps/web/services/auth.service.ts with a login(email, password) function.

3. Frontend: The Login Form Component
   Location: apps/web/app/(auth)/login/page.tsx.

Tech Stack: Use react-hook-form combined with zod for validation.

Schema: Email (required, valid email), Password (required).

UI Components: Use the Shadcn components installed previously (Form, Input, Button, Card).

Behavior:

Show a loading spinner on the button while submitting.

On Success: Store the token in a cookie named token, show a success Toast, and redirect to /dashboard using useRouter.

On Error: Show a red alert or Toast with the error message from the backend.

Mobile UX: Ensure inputs have appropriate type (email, password) and inputMode so the mobile keyboard shows up correctly.

4. Frontend: Middleware (Route Protection)
   Create a middleware.ts file in the root of apps/web.

Logic:

Define protected routes (e.g., paths starting with /dashboard).

Check for the presence of the token cookie.

If user tries to access /dashboard/\* without a token -> Redirect to /login.

If user tries to access /login with a valid token -> Redirect to /dashboard.

Acceptance Criteria (Checklist)
[ ] Backend CORS is configured to allow the frontend.

[ ] The Login Form validates inputs before sending (e.g., "Invalid email" appears immediately).

[ ] Submitting the form with correct credentials stores a cookie and redirects to Dashboard.

[ ] Submitting with wrong credentials shows an error message.

[ ] Security Test: If I manually delete the token cookie from DevTools and refresh the Dashboard, I am immediately kicked back to Login.

Output: Provide:

The main.ts CORS update.

The api.ts (Axios setup).

The complete login/page.tsx code (beautifully styled).

The middleware.ts logic.
