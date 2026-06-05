/**
 * FormXpCalculator
 *
 * Pure, deterministic calculator that derives the base XP earned from a
 * campaign form submission.  Zero NestJS / TypeORM imports — safe to unit-
 * test without a database or DI container.
 *
 * Supports two config shapes:
 *  • Array format  – `formConfig.questions` is FormQuestion[]  (current)
 *  • Legacy format – `formConfig.questions` is a key→config object map
 */

import { FormQuestion } from "@halaqat/types";

// ── Public types ─────────────────────────────────────────────────────────────

export interface LegacyQuestionConfig {
  type: string;
  xpMap?: Record<string, number>;
  xpYes?: number;
  xpNo?: number;
  multiplier?: number;
  max?: number;
}

export interface FormConfig {
  submitted_xp?: number;
  questions?: FormQuestion[] | Record<string, LegacyQuestionConfig> | unknown;
}

// ── Calculator ───────────────────────────────────────────────────────────────

/**
 * Derives the base XP for a form submission.
 *
 * @param submissionData - The raw answers keyed by question ID.
 * @param formConfig     - The campaign's form configuration object.
 * @returns Total base XP (>= 0).  Malformed entries are silently skipped.
 */
export function calculateXPFromFormConfig(
  submissionData: Record<string, unknown>,
  formConfig: FormConfig,
): number {
  const submittedXp = (formConfig.submitted_xp as number) ?? 0;
  let totalXp = submittedXp;

  const questions = formConfig.questions;
  if (!questions || typeof questions !== "object") return totalXp;

  // ── Array format (current) ─────────────────────────────────────────────
  if (Array.isArray(questions)) {
    for (const q of questions as FormQuestion[]) {
      const val = submissionData[q.id];
      if (val === undefined || val === null) continue;

      switch (q.type) {
        case "GRID":
          if (typeof val === "object" && q.columns) {
            const xpMap = Object.fromEntries(q.columns.map((c) => [c.value, c.xp]));
            for (const colVal of Object.values(val as Record<string, string>)) {
              totalXp += xpMap[colVal] ?? 0;
            }
          }
          break;
        case "BOOLEAN":
          totalXp += val === true ? (q.xpYes ?? 0) : (q.xpNo ?? 0);
          break;
        case "NUMBER": {
          const num = Math.min(Number(val) || 0, q.max ?? Infinity);
          totalXp += num * (q.multiplier ?? 0);
          break;
        }
        case "SELECT":
          if (q.options) {
            const opt = q.options.find((o) => o.value === val);
            totalXp += opt?.xp ?? 0;
          }
          break;
      }
    }
    return totalXp;
  }

  // ── Legacy format (key → config map) ──────────────────────────────────
  const legacy = questions as Record<string, LegacyQuestionConfig>;
  for (const [key, qConfig] of Object.entries(legacy)) {
    const val = submissionData[key];
    if (val === undefined || val === null) continue;

    switch (qConfig.type) {
      case "GRID":
        if (typeof val === "object" && qConfig.xpMap) {
          for (const colVal of Object.values(val as Record<string, string>)) {
            totalXp += qConfig.xpMap[colVal] ?? 0;
          }
        }
        break;
      case "BOOLEAN":
        totalXp += val === true ? (qConfig.xpYes ?? 0) : (qConfig.xpNo ?? 0);
        break;
      case "NUMBER": {
        const num = Math.min(Number(val) || 0, qConfig.max ?? Infinity);
        totalXp += num * (qConfig.multiplier ?? 0);
        break;
      }
    }
  }

  return totalXp;
}
