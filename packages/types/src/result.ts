/**
 * Result<T, E> — Discriminated union for expected business outcomes.
 *
 * Use this instead of throwing DomainExceptions for outcomes that are
 * "expected" from a business perspective (e.g., "quest already completed
 * today") but not truly exceptional.  Unlike nullable returns, the error
 * branch carries a typed reason.
 *
 * Usage:
 *   function submitQuest(id: string): Promise<Result<QuestReward, "ALREADY_COMPLETED" | "NOT_FOUND">>
 *
 *   const result = await submitQuest(id);
 *   if (!result.ok) {
 *     // result.error is "ALREADY_COMPLETED" | "NOT_FOUND"
 *   } else {
 *     // result.value is QuestReward
 *   }
 */

export type Result<T, E = string> =
  | { ok: true;  value: T }
  | { ok: false; error: E; details?: unknown };

/** Convenience constructors */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E, details?: unknown): Result<never, E> {
  return { ok: false, error, details };
}
