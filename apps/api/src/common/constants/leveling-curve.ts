export const XP_LEVEL_CURVE = [
  0,        // Level 1: 0 - 99 XP
  100,      // Level 2: 100 - 299 XP
  300,      // Level 3: 300 - 599 XP
  600,      // Level 4: 600 - 999 XP
  1000,     // Level 5: 1000 - 1499 XP
  1500,     // Level 6: 1500 - 2099 XP
  2100,     // Level 7: 2100 - 2799 XP
  2800,     // Level 8: 2800 - 3599 XP
  3600,     // Level 9: 3600 - 4499 XP
  4500,     // Level 10: 4500 - 5499 XP
  5500,     // Level 11: 5500 - 6599 XP
  6600,     // Level 12: 6600 - 7799 XP
  7800,     // Level 13: 7800 - 9099 XP
  9100,     // Level 14: 9100 - 10499 XP
  10500,    // Level 15: 10500 - 11999 XP
  12000,    // Level 16: 12000 - 13599 XP
  13600,    // Level 17: 13600 - 15299 XP
  15300,    // Level 18: 15300 - 17099 XP
  17100,    // Level 19: 17100 - 18999 XP
  19000,    // Level 20: 19000+ XP
];

/**
 * Calculates current level based on total XP using the predefined exponential curve.
 * Levels are 1-indexed. If XP exceeds the max curve, it extrapolates (though curve goes up to 20).
 * 
 * @param totalXp The current total amount of XP bounded by the student
 * @returns The current calculated integer Level
 */
export function calculateLevelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1;

  for (let i = XP_LEVEL_CURVE.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVEL_CURVE[i]!) {
      // Index is 0-based, level is 1-based, so return index + 1
      return i + 1;
    }
  }

  // Fallback for some reason, though logic shouldn't hit here due to the <= 0 check
  return 1;
}
