# Task-49 Migration Notes — CrudDialog Primitive

## Overview

Introduced a generic `CrudDialog<TFormValues, TResult>` primitive that centralises:

- `react-hook-form` + Zod resolver lifecycle
- Loading state (spinner, disabled buttons)
- Server-error display (`form.setError("root", ...)` → Arabic alert banner)
- Auto-reset on dialog close
- Consistent Arabic cancel / submit labels ("إلغاء" / "حفظ" / "تحديث")

All 8 existing dialog components were migrated to use this primitive, eliminating
duplicated form boilerplate in every file.

---

## New Files

| File | Purpose |
|---|---|
| `src/components/ui/crud-dialog.tsx` | Generic dialog primitive |
| `src/components/ui/form-fields/text-field.tsx` | TextField wrapper |
| `src/components/ui/form-fields/number-field.tsx` | NumberField wrapper |
| `src/components/ui/form-fields/select-field.tsx` | SelectField wrapper |
| `src/components/ui/form-fields/textarea-field.tsx` | TextareaField wrapper |
| `src/components/ui/form-fields/switch-field.tsx` | SwitchField wrapper |
| `src/components/ui/form-fields/date-field.tsx` | DateField wrapper |
| `src/components/ui/form-fields/async-select-field.tsx` | AsyncSelectField (TanStack Query) |
| `src/components/ui/form-fields/index.ts` | Barrel re-export |
| `src/lib/validation.ts` | `arabicValidators` factory |
| `src/lib/schemas/user.ts` | User schemas + role constants |
| `src/lib/schemas/circle.ts` | Circle schemas + gender constants |
| `src/lib/schemas/student.ts` | Student schemas |
| `src/lib/schemas/quest.ts` | Quest schemas |
| `src/lib/schemas/milestone.ts` | Milestone schemas |
| `src/lib/schemas/achievement.ts` | Achievement schemas |
| `src/lib/schemas/event.ts` | Seasonal event schemas |
| `src/lib/schemas/custom-rule.ts` | Custom-rule schemas |
| `src/lib/schemas/index.ts` | Barrel re-export |

---

## Line-Count Delta per Migrated Dialog

| Dialog file | Before (lines) | After (lines) | Reduction |
|---|---|---|---|
| `create-user-dialog.tsx` | 291 | ~70 | −76% |
| `edit-user-dialog.tsx` | 280 | ~55 | −80% |
| `reset-password-dialog.tsx` | 149 | ~35 | −77% |
| `create-circle-dialog.tsx` | 328 | ~110 | −66% |
| `create-student-dialog.tsx` | 408 | ~115 | −72% |
| `edit-student-dialog.tsx` | 547 | ~105 | −81% |
| `create-custom-rule-dialog.tsx` | 178 | ~70 | −61% |
| `quests-tab.tsx` (inline dialog) | 416 | ~160 | −62% |
| `milestones-tab.tsx` (inline dialog) | 296 | ~120 | −59% |
| `achievements-tab.tsx` (inline dialog) | 402 | ~150 | −63% |
| `events-tab.tsx` (inline dialog) | 400 | ~155 | −61% |
| **Total** | **3,695** | **~1,145** | **−69%** |

---

## Test Coverage

| Test file | Cases | What it covers |
|---|---|---|
| `src/lib/schemas/__tests__/student.test.ts` | 10 | `createStudentSchema`, `editStudentSchema` |
| `src/lib/schemas/__tests__/circle.test.ts` | 13 | `createCircleSchema`, `editCircleSchema` |
| `src/lib/schemas/__tests__/user.test.ts` | 15 | `createUserSchema`, `editUserSchema`, `resetPasswordSchema` |
| `src/components/ui/__tests__/crud-dialog.test.tsx` | 14 | Render, submit, validation, server error, close |

Run tests with:

```bash
cd apps/web
pnpm install   # first time only
pnpm test
```

---

## Architecture Notes

### Children as render-prop

```tsx
<CrudDialog schema={mySchema} defaultValues={...} onSubmit={fn}>
  {(form) => (
    <>
      <TextField name="title" label="العنوان" required />
      {form.watch("type") === "quiz" && <NumberField name="score" label="الدرجة" />}
    </>
  )}
</CrudDialog>
```

The `form` argument is the live `UseFormReturn<TFormValues>` instance. Callers can
use `form.watch()` for conditional rendering without importing `react-hook-form`.

### Server errors

When `onSubmit` throws, the error is extracted in this order:

1. `err.messageAr` — `ApiError` user-facing Arabic message (Task-47)
2. `err.response?.data?.message` — Axios/REST envelope message
3. `err.message` — plain JavaScript error
4. Fallback: `"حدث خطأ غير متوقع، حاول مرة أخرى"`

The resolved string is set on `form.root` and rendered as an Arabic alert banner
inside the form, above the footer buttons.

### Module-level query functions in AsyncSelectField

To avoid re-creating `queryFn` references on every render (which would cause
TanStack Query to refetch on each keystroke), the `queryFn` prop is meant to be a
**module-level** or **stable** function reference:

```tsx
// ✅ Correct — module-level function
const fetchTeachers = (): Promise<Teacher[]> =>
  api.get<Teacher[]>("/users", { params: { role: "TEACHER" } }).then((r) => r.data);

// In JSX:
<AsyncSelectField name="teacherId" queryFn={fetchTeachers} ... />
```

---

## How to Add a New Dialog

1. Create (or reuse) a Zod schema in `src/lib/schemas/<entity>.ts` using
   `arabicValidators` helpers.
2. In your component file, import `CrudDialog` and the field components you need.
3. Wire up `onSubmit` to your TanStack Query mutation.
4. Done — no `useForm`, no `zodResolver`, no reset logic, no error toast wiring.
