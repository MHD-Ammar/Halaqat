# BUGS_FIXED.md

Audit completed as part of **Task-50** (Error Handling, Logging & Validation Infrastructure).

---

## Bug 1 — `DailyChallengeService.resolveCampaignId`: silent fallback to wrong campaign ✅ FIXED

**File:** `apps/api/src/daily-challenge/daily-challenge.service.ts`  
**Symptom:** When a non-UUID campaign key was supplied (e.g. `"ramadan"`) and no
*active* campaign existed, the method fell back to `findOne(Campaign, { order: { createdAt: "DESC" } })`
— the most recently *created* (but possibly long-expired) campaign. Student answers were then
attributed to the wrong campaign silently.  
**Fix:** Removed the final fallback entirely. The method now throws
`BadRequestException("No active campaign is available at this time")` when no active campaign
is found. Callers see a clear error instead of silent data corruption.

---

## Bug 2 — `AnalyticsService.getDailyOverview`: server-local-time boundary ✅ FIXED

**File:** `apps/api/src/analytics/analytics.service.ts`  
**Symptom:** `new Date(); today.setHours(0,0,0,0)` produces midnight in the *server's local
timezone*. If the server runs in UTC+0 but a mosque is in UTC+3, counts for that mosque's
"today" are wrong for the first/last 3 hours of each day.  
**Fix:** Changed to `setUTCHours(0,0,0,0)` to pin the boundary to UTC midnight. A future
enhancement can read `Mosque.timezone` and apply a proper per-mosque offset.

---

## Bug 3 — `MushafService.bulkCreateMistakes`: no recitation ownership check ✅ FIXED

**File:** `apps/api/src/mushaf/mushaf.service.ts`  
**Symptom:** A caller could provide any `recitationId` in `BulkCreateMistakesDto` regardless
of whether that recitation belonged to `dto.studentId`. Mistakes would be saved against a
different student's recitation.  
**Fix:** Before saving, the service now loads the recitation and compares
`recitation.studentId` to `dto.studentId`. Mismatch → `ForbiddenException`. Non-existent
recitation → `NotFoundException`.

---

## Bug 4 — `AuthService.validateUser`: user enumeration via timing attack ✅ FIXED

**File:** `apps/api/src/auth/auth.service.ts`  
**Symptom:** When the email did not exist the function returned `null` immediately (no bcrypt
call). When the email existed but password was wrong, a full bcrypt comparison ran (~100 ms).
The timing difference allowed an attacker to determine which email addresses are registered.  
**Fix:** When the user is not found, a dummy bcrypt comparison is now performed against a
pre-computed hash (`DUMMY_HASH`) so the response time is statistically indistinguishable from a
real comparison. A small (50–150 ms) random jitter is added on all failure paths.

---

## Bug 5 — `console.log` in `ExamsService.createExam`: debug noise in production ✅ FIXED

**File:** `apps/api/src/exams/exams.service.ts:45`  
**Symptom:** `console.log("Creating exam:", { examinerId, dto, mosqueId })` emitted to stdout
on every exam creation, including production. No correlation ID, no log level.  
**Fix:** Replaced with `this.logger.log({ msg: "Creating exam", ... })` using NestJS `Logger`
with the class name as context.

---

## Infrastructure Changes (not bugs, but hardening)

| Change | File |
|--------|------|
| `AllExceptionsFilter` — stable `{ code, message, messageAr, details, requestId }` shape | `common/filters/http-exception.filter.ts` |
| `RequestIdMiddleware` — attaches UUID to every request, echoes as `x-request-id` header | `common/middleware/request-id.middleware.ts` |
| `ERROR_CODES` catalog + `ERROR_MESSAGES_AR` | `common/errors/error-codes.ts`, `error-messages.ts` |
| `DomainException` + factory subclasses | `common/errors/domain-exception.ts` |
| Strict `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, domain error shape | `main.ts` |
| `Logger` added to: `AnalyticsService`, `DailyChallengeService`, `MushafService`, `PointsService`, `StudentsService`, `CirclesService`, `SessionsService`, `AuthService` | Multiple service files |
