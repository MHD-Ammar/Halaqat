# Testing Guide

This repository uses a layered test strategy:

- Unit tests: pure logic (calculators, validators, utility functions).
- Integration tests: backend service behavior with a real Postgres database.
- HTTP tests: controller + guard + validation pipeline coverage.
- Component and hook tests: critical frontend UI and custom hooks.
- E2E smoke tests: high-stakes end-user journeys.

## Naming

- Unit/integration: `*.spec.ts` or `*.spec.tsx`
- HTTP/E2E API tests: `*.e2e.spec.ts`
- Playwright specs: `e2e/*.spec.ts`

## Structure

- Use `describe("Subject")` then `describe("when X")` then `it("should Y")`.
- Arrange / act / assert with blank lines between sections.
- Prefer factory-based test data instead of inline magic objects.
- Avoid `setTimeout` in tests; use RTL `waitFor` or Playwright `expect` polling.

## Running Locally

- Install dependencies: `pnpm install`
- Full checks:
  - `pnpm -r typecheck`
  - `pnpm -r lint`
  - `pnpm -r test`
- Coverage:
  - `pnpm --filter @halaqat/api test:cov`
  - `pnpm --filter @halaqat/web test:cov`
- E2E:
  - `pnpm exec playwright install --with-deps`
  - `pnpm test:e2e`

## Coverage Policy

- Backend calculators: 100% lines.
- Backend global: 60% lines minimum.
- Frontend hooks: 70% lines target.
- Frontend components: 50% lines minimum.
- Critical components (CrudDialog, MushafAssessor, PendingMistakesPanel): 80% target.

