export const STREAK_MULTIPLIER_TIERS = [
  { minDays: 3, multiplier: 1.2, label: '1.2x', labelAr: '١.٢×' },
  { minDays: 7, multiplier: 1.5, label: '1.5x', labelAr: '١.٥×' },
  { minDays: 14, multiplier: 1.8, label: '1.8x', labelAr: '١.٨×' },
  { minDays: 30, multiplier: 2.0, label: '2.0x', labelAr: '٢×' },
];

export function getStreakMultiplier(streakDays: number): { multiplier: number; label: string; labelAr: string; tier: number } {
  let result = { multiplier: 1.0, label: '1x', labelAr: '١×', tier: 0 };
  for (let i = STREAK_MULTIPLIER_TIERS.length - 1; i >= 0; i--) {
    const tierInfo = STREAK_MULTIPLIER_TIERS[i];
    if (!tierInfo) continue;

    if (streakDays >= tierInfo.minDays) {
      result = { 
        multiplier: tierInfo.multiplier, 
        label: tierInfo.label, 
        labelAr: tierInfo.labelAr, 
        tier: i + 1 
      };
      break;
    }
  }
  return result;
}

export function getNextMultiplierTier(streakDays: number): { daysNeeded: number; nextMultiplier: string } | null {
  for (const tier of STREAK_MULTIPLIER_TIERS) {
    if (streakDays < tier.minDays) {
      return { daysNeeded: tier.minDays - streakDays, nextMultiplier: tier.labelAr };
    }
  }
  return null; // Already at max tier
}
