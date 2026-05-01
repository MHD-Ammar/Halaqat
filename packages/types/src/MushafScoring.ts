/**
 * Mushaf Scoring
 *
 * Pure-data definitions for the per-page recitation score system.
 *
 * Each Mushaf page is graded out of {@link DEFAULT_SCORING_CONFIG.baseScore}.
 * The score starts at the base and is reduced by the per-mistake-type
 * deductions configured below. A "hard rule" can also force a quality bucket
 * regardless of the numeric score (e.g. 3+ memorization mistakes ⇒ POOR).
 *
 * The result of scoring a page is a {@link PageScoreResult}: the numeric
 * score, the suggested {@link RecitationQuality}, and which (if any) hard
 * rule fired. The teacher can always override the suggested quality, so the
 * algorithm exists to give a good *default*, not to be authoritative.
 *
 * Keep this file pure: no React, no I/O, no DOM. Both the API and the web
 * app should be able to import it.
 */

import { MistakeType } from "./MistakeType";
import { RecitationQuality } from "./RecitationQuality";

/**
 * Tally of mistakes for a single page (or session), keyed by mistake type.
 * Values default to 0 if missing.
 */
export type MistakeCounts = Partial<Record<MistakeType, number>>;

/**
 * Configuration used by {@link calculatePageScore}.
 *
 * Numbers are kept as plain primitives (no branded types) so the config can
 * be safely serialised to JSON if it later needs to be stored per-circle or
 * per-organisation.
 */
export interface ScoringConfig {
  /** Maximum possible score for a single page. */
  baseScore: number;
  /** Points subtracted from the base score for each mistake of the given type. */
  deductions: Record<MistakeType, number>;
  /**
   * Score thresholds (inclusive lower-bound) that map a numeric score to a
   * suggested {@link RecitationQuality} bucket. Buckets are checked from
   * highest to lowest — anything below the lowest threshold falls into the
   * implicit "POOR" bucket.
   */
  qualityThresholds: {
    excellent: number;
    veryGood: number;
    good: number;
  };
  /**
   * Hard rules that override the numeric quality mapping. Each rule fires
   * when the count for `type` is `>=` `count`. The first rule that fires
   * (in declaration order) wins.
   */
  hardRules: ReadonlyArray<{
    type: MistakeType;
    count: number;
    quality: RecitationQuality;
    /** Reason shown to the teacher in the UI. */
    reason: string;
  }>;
}

/**
 * Default scoring configuration used by both the recitation flow and the
 * Mushaf Assessor. Reflects pedagogy used in most halaqat:
 *
 * - 1 memorization mistake → very good (8/10)
 * - 2 memorization mistakes → good (6/10)
 * - 3+ memorization mistakes → redo regardless of remaining score
 * - Tashkeel weighted as heavily as memorization (a wrong vowel can change
 *   the meaning of the verse in Arabic)
 * - Tajweed weighted lightly — pronunciation polish, not content
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  baseScore: 10,
  deductions: {
    [MistakeType.MEMORIZATION]: 2,
    [MistakeType.TASHKEEL]: 2,
    [MistakeType.TAJWEED]: 0.5,
  },
  qualityThresholds: {
    excellent: 9,
    veryGood: 7,
    good: 5,
  },
  hardRules: [
    {
      type: MistakeType.MEMORIZATION,
      count: 3,
      quality: RecitationQuality.POOR,
      reason: "ثلاثة أخطاء حفظ أو أكثر",
    },
  ],
};

/**
 * Result of grading a single page.
 */
export interface PageScoreResult {
  /** Numeric score, clamped to `[0, baseScore]`, rounded to one decimal. */
  score: number;
  /** Maximum possible score (mirrors `config.baseScore`). */
  maxScore: number;
  /** Suggested quality bucket — teacher can override. */
  suggestedQuality: RecitationQuality;
  /**
   * If a hard rule fired, the rule that decided the quality. `null` when
   * the quality came from the numeric thresholds.
   */
  triggeredHardRule: ScoringConfig["hardRules"][number] | null;
}

/** Round to one decimal place without floating-point noise. */
function roundOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Map a numeric score to a {@link RecitationQuality} bucket using the given
 * thresholds. Used internally by {@link calculatePageScore}.
 */
function qualityFromScore(
  score: number,
  thresholds: ScoringConfig["qualityThresholds"],
): RecitationQuality {
  if (score >= thresholds.excellent) return RecitationQuality.EXCELLENT;
  if (score >= thresholds.veryGood) return RecitationQuality.VERY_GOOD;
  if (score >= thresholds.good) return RecitationQuality.GOOD;
  return RecitationQuality.POOR;
}

/**
 * Grade a single page given the mistake counts and a scoring config.
 *
 * Pure function — same inputs always produce the same output. Safe to call
 * inside a render loop.
 */
export function calculatePageScore(
  counts: MistakeCounts,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): PageScoreResult {
  // Compute raw deductions
  let total = config.baseScore;
  for (const type of Object.values(MistakeType)) {
    const n = counts[type] ?? 0;
    total -= n * config.deductions[type];
  }

  // Clamp to [0, baseScore]
  const score = roundOneDecimal(
    Math.max(0, Math.min(config.baseScore, total)),
  );

  // Hard rules take precedence over numeric mapping
  for (const rule of config.hardRules) {
    if ((counts[rule.type] ?? 0) >= rule.count) {
      return {
        score,
        maxScore: config.baseScore,
        suggestedQuality: rule.quality,
        triggeredHardRule: rule,
      };
    }
  }

  return {
    score,
    maxScore: config.baseScore,
    suggestedQuality: qualityFromScore(score, config.qualityThresholds),
    triggeredHardRule: null,
  };
}

/**
 * Aggregate results from multiple pages into a single session-level result.
 *
 * - `score` is the arithmetic mean of the per-page scores, rounded to one
 *   decimal place.
 * - `suggestedQuality` is computed by re-running the threshold mapping on
 *   the average score, but if any page in the session triggered a hard rule
 *   the overall quality is downgraded to that rule's quality (the most
 *   severe wins).
 * - Returns `null` if `results` is empty so callers can fall back to a
 *   sensible default rather than dividing by zero.
 */
export function averagePageScores(
  results: ReadonlyArray<PageScoreResult>,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): PageScoreResult | null {
  if (results.length === 0) return null;

  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const avg = roundOneDecimal(sum / results.length);

  // Find the most severe hard rule that fired anywhere in the session.
  // "Most severe" = first hard rule in declaration order to ever fire, since
  // the config is authored with severity decreasing.
  const firstHardRuleHit =
    results.find((r) => r.triggeredHardRule !== null)?.triggeredHardRule ??
    null;

  return {
    score: avg,
    maxScore: config.baseScore,
    suggestedQuality: firstHardRuleHit
      ? firstHardRuleHit.quality
      : qualityFromScore(avg, config.qualityThresholds),
    triggeredHardRule: firstHardRuleHit,
  };
}

/**
 * Tally raw mistake records into a {@link MistakeCounts} object.
 * Accepts any value with a `mistakeType` field — works for both pending
 * (in-memory) and saved (DB) shapes.
 */
export function tallyMistakes(
  mistakes: ReadonlyArray<{ mistakeType: MistakeType }>,
): MistakeCounts {
  const counts: MistakeCounts = {};
  for (const m of mistakes) {
    counts[m.mistakeType] = (counts[m.mistakeType] ?? 0) + 1;
  }
  return counts;
}
