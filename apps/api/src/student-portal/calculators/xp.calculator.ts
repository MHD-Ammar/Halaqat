import { getStreakMultiplier } from "../../common/constants/streak-multiplier";

export interface XpAwardInput {
  baseXp: number;
  streakDays: number;
  eventMultiplier: number;
}

export interface XpAwardResult {
  finalXp: number;
  streakMultiplier: number;
  eventMultiplier: number;
  breakdown: { base: number; streakBonus: number; eventBonus: number };
}

export function computeXpAward(input: XpAwardInput): XpAwardResult {
  if (input.baseXp < 0) throw new Error("baseXp must be non-negative");

  const { multiplier: streakMultiplier } = getStreakMultiplier(input.streakDays);
  const withStreak = Math.round(input.baseXp * streakMultiplier);
  const finalXp = Math.round(input.baseXp * streakMultiplier * input.eventMultiplier);

  return {
    finalXp,
    streakMultiplier,
    eventMultiplier: input.eventMultiplier,
    breakdown: {
      base: input.baseXp,
      streakBonus: withStreak - input.baseXp,
      eventBonus: finalXp - withStreak,
    },
  };
}
