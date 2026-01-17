Instruction to AI: Act as a Senior Full-Stack Architect. We are starting a greenfield project called "Halaqat" (Mosque Management System). Your goal is to set up a robust Monorepo infrastructure using TurboRepo and pnpm.

Please follow the instructions below strictly. Do not hallucinate package versions; use the latest stable versions.

Project Structure Overview
We need a Monorepo with the following workspace structure:

.
├── apps
│ ├── api # NestJS (Backend)
│ └── web # Next.js 14+ (Frontend - Mobile First)
├── packages
│ ├── types # Shared DTOs, Enums, and Interfaces (Crucial for Type Safety)
│ ├── ui # (Optional placeholder for future shared UI components)
│ └── config # Shared ESLint/TSConfig
├── package.json # Root config
├── pnpm-workspace.yaml
└── turbo.json
Detailed Implementation Steps

1. Initialization & Tooling
   Initialize a new TurboRepo project.

Use pnpm as the package manager (mandatory).

Ensure the root package.json has scripts for dev, build, and lint that trigger turbo pipelines.

2. The Shared types Package (Priority)
   Create a package named @halaqat/types inside packages/types.

Action: Create a dummy interface UserRole.ts (exporting an Enum: ADMIN, TEACHER, SUPERVISOR) inside this package to test the linkage.

Build Config: Ensure package.json in this folder has proper exports ("main", "types") so both NestJS and Next.js can consume it directly.

Goal: We must be able to import types like import { UserRole } from '@halaqat/types' in both apps.

3. The Backend (apps/api)
   Initialize a standard NestJS application.

Port: Configure it to run on port 3001 (to avoid conflict with web).

Cleanup: Remove the default .spec files and boilerplate controllers. Keep it clean.

Dependency: Add @halaqat/types as a dependency in apps/api/package.json.

4. The Frontend (apps/web)
   Initialize a Next.js application (App Router, TypeScript, Tailwind CSS, ESLint).

Port: Default to 3000.

Styling: Ensure Tailwind CSS is configured correctly.

Dependency: Add @halaqat/types as a dependency in apps/web/package.json.

Clean: Remove default Vercel svg logos and styling. Create a simple Homepage specifically displaying: "Halaqat System - Mobile First".

5. Developer Experience (DX)
   Configure turbo.json so that running pnpm dev in the root runs both apps simultaneously in parallel.

Ensure Hot Module Replacement (HMR) works for both.

Technical Constraints & Rules
Strict TypeScript: Enable strict: true in all tsconfig.json files.

No Circular Dependencies: Ensure apps depend on packages, but packages never depend on apps.

Path Aliases: Configure @/\* aliases for both Next.js and NestJS to point to their respective src directories.

Acceptance Criteria (Checklist)
[ ] Running pnpm install works without peer dependency warnings.

[ ] Running pnpm dev starts both the Next.js frontend (localhost:3000) and NestJS backend (localhost:3001).

[ ] Integration Test: You can import the UserRole enum from @halaqat/types into apps/api/src/app.module.ts AND apps/web/app/page.tsx without TypeScript errors.

[ ] The project structure matches the overview provided above.

Output: Please provide the shell commands to set this up (one by one or a script), and the content of key configuration files (specifically package.json for all workspaces, turbo.json, and tsconfig files) needed to achieve the linking described above.
