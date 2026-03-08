export const LEVEL_TITLES: Record<number, string> = {
  1: 'beginner',
  3: 'learner',
  5: 'diligent',
  7: 'outstanding',
  10: 'rising_hafiz',
  13: 'distinguished_hafiz',
  15: 'circle_star',
  18: 'quran_champion',
  20: 'legend',
};

export function getTitleKeyForLevel(level: number): string {
  let bestTitleKey = LEVEL_TITLES[1]!;
  for (const [minLevel, key] of Object.entries(LEVEL_TITLES)) {
    if (level >= Number(minLevel)) {
      bestTitleKey = key;
    }
  }
  return bestTitleKey;
}