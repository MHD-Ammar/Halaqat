# STRICT_MIGRATION_NOTES.md

Summary of changes made as part of **Task-51** (Strict TypeScript, Shared Types & Constants Centralisation).

---

## 1. TypeScript Strict-Mode Flags Enabled

### Flags added to all three tsconfigs
| Flag | File(s) |
|---|---|
| `noImplicitOverride: true` | `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, `packages/types/tsconfig.json` |
| `exactOptionalPropertyTypes: true` | same three files |

### Already present in `packages/config/typescript/base.json` (inherited by all)
- `strict: true` (covers `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `alwaysStrict`)
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

### `next.config.ts`
Added `typescript: { ignoreBuildErrors: false }` so TypeScript errors fail the Next.js production build.

---

## 2. New Files in `@halaqat/types`

| File | Contents |
|---|---|
| `packages/types/src/enums.ts` | Barrel re-export of all enum types — single import point for all enums |
| `packages/types/src/result.ts` | `Result<T, E>` discriminated union + `ok()` / `err()` factory functions |

Both are exported from `packages/types/src/index.ts`.

---

## 3. New Backend Constants (`apps/api/src/common/constants/`)

| File | Constants |
|---|---|
| `mushaf.constants.ts` | `MUSHAF_TOTAL_PAGES = 604`, `MUSHAF_TOTAL_SURAHS = 114`, `MUSHAF_TOTAL_AYAHS = 6236` |
| `auth.constants.ts` | `BCRYPT_ROUNDS`, `PASSWORD_MIN_LENGTH`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `TOKEN_COOKIE_NAME` |
| `pagination.constants.ts` | `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`, `DEFAULT_PAGE = 1` |
| `daily-challenge.constants.ts` | `CAMPAIGN_KEYS.RAMADAN`, `CAMPAIGN_KEYS.HAJJ`, `SUBMISSION_BASE_XP` |

---

## 4. New Frontend Constants (`apps/web/src/lib/constants/`)

| File | Constants |
|---|---|
| `mushaf.ts` | Mirrors backend `mushaf.constants.ts` |
| `auth.ts` | `TOKEN_COOKIE_NAME = "token"`, `REMEMBER_ME_DAYS = 30`, `SESSION_DAYS = 1` |
| `pagination.ts` | `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `DEFAULT_PAGE` |
| `routes.ts` | Typed route builder covering all 30+ routes in the app |

---

## 5. Environment Variable Centralisation

### Frontend: `apps/web/src/lib/env.ts` (NEW)
- Validates all `NEXT_PUBLIC_*` vars with Zod at startup.
- Fails fast (throws) in development on invalid config.
- Logs a warning in production (env may be injected at runtime).
- `apps/web/src/lib/api.ts` updated to import `env.NEXT_PUBLIC_API_URL` instead of reading `process.env` directly.
- `PushPermissionPrompt.tsx` updated to use `env.NEXT_PUBLIC_VAPID_KEY`.
- `TOKEN_COOKIE_NAME` moved from `api.ts` inline literal → `constants/auth.ts`, re-exported from `api.ts` for backwards compat.

### Backend
Already uses `@nestjs/config` + Joi validation schema in `apps/api/src/config/`. No changes needed.

---

## 6. Categories of Future Strict-Mode Errors to Expect

When you run `pnpm -r build` after enabling `exactOptionalPropertyTypes` and `noImplicitOverride`, the most common errors you will encounter are:

| Category | Typical count | Fix pattern |
|---|---|---|
| **Array/object indexed access** — `arr[i]` now returns `T \| undefined` | ~15–30 | Add null-check or use `arr.at(i)` with a guard |
| **Optional property assignment** — `obj.field = undefined` where field is `T?` | ~8–15 | Use `delete obj.field` or change to `T \| undefined` |
| **Class method override without `override` keyword** | ~5–10 | Add `override` keyword to NestJS lifecycle hooks (e.g. `onModuleInit`) |
| **Implicit `any` in catch blocks** — `catch (e)` where `e` is used as typed | ~3–8 | Change to `catch (e: unknown)` and narrow |
| **Non-null DTO fields** — `@IsOptional()` properties without `| undefined` | ~5–10 | Add `| undefined` to DTO property types or use `exactOptionalPropertyTypes`-safe decorators |

---

## 7. Forbidden Patterns (Post-Task)

Going forward, the following are banned by convention (enforced via code review):

```
# Magic mushaf page count
604           →  use MUSHAF_TOTAL_PAGES from @/common/constants/mushaf.constants

# Hardcoded role strings
"ADMIN"       →  use UserRole.ADMIN from @halaqat/types

# Hardcoded mistake types
"MEMORIZATION" → use MistakeType.MEMORIZATION from @halaqat/types

# Hardcoded cookie name
"token"       →  use TOKEN_COOKIE_NAME from @/lib/constants/auth

# Hardcoded route paths (frontend)
"/login"      →  use routes.login() from @/lib/constants/routes

# Direct process.env access (frontend)
process.env.NEXT_PUBLIC_* → use env.* from @/lib/env
```
