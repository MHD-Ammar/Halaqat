# Halaqat

[![CI](https://github.com/your-org/halaqat/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/halaqat/actions/workflows/ci.yml)

Monorepo for Halaqat (API + Web + shared packages).

## Running Tests Locally

1. Install deps:
```bash
pnpm install
```

2. Lint and typecheck:
```bash
pnpm -r lint
pnpm -r typecheck
```

3. Unit/integration tests:
```bash
pnpm -r test
pnpm --filter @halaqat/api test:cov
pnpm --filter @halaqat/web test:cov
```

4. E2E smoke tests:
```bash
pnpm exec playwright install --with-deps
pnpm test:e2e
```

See [TESTING.md](./TESTING.md) for conventions and coverage policy.

