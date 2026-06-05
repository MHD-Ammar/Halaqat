/**
 * i18n-format.ts
 *
 * Arabic pluralization utilities for the Halaqat web app.
 *
 * Arabic has six grammatical number forms, but for mistake counts we need:
 *
 *  0          → "لا أخطاء"       (no mistakes)
 *  1          → "خطأ واحد"       (one mistake)
 *  2          → "خطآن"           (two mistakes — dual form)
 *  3 – 10     → "{n} أخطاء"      (3-10: plural with tāʾ marbūṭa)
 *  11+        → "{n} خطأ"        (11+: singular-looking "counted noun")
 *
 * Reference: Arabic grammatical number rules for counted nouns (المعدود).
 */

/**
 * Return a fully-formed Arabic string for a mistake count.
 *
 * @example
 * formatMistakeCount(0)   // "لا أخطاء"
 * formatMistakeCount(1)   // "خطأ واحد"
 * formatMistakeCount(2)   // "خطآن"
 * formatMistakeCount(5)   // "5 أخطاء"
 * formatMistakeCount(11)  // "11 خطأ"
 * formatMistakeCount(100) // "100 خطأ"
 */
export function formatMistakeCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError(`formatMistakeCount: expected a non-negative finite number, got ${n}`);
  }

  if (n === 0) return "لا أخطاء";
  if (n === 1) return "خطأ واحد";
  if (n === 2) return "خطآن";
  if (n <= 10) return `${n} أخطاء`;
  return `${n} خطأ`;
}

/**
 * Short numeric badge label — just the count, no noun.
 * Falls back to "0" when n is 0 so badges stay compact.
 *
 * Used where space is tight (e.g. SaveBar badge chip).
 */
export function mistakeCountBadge(n: number): string {
  return String(Math.max(0, n));
}
