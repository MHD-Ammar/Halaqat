export { calculateLevelFromXp, XP_LEVEL_CURVE } from "../../common/constants/leveling-curve";

export interface LevelTransition {
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
}

import { calculateLevelFromXp } from "../../common/constants/leveling-curve";

export function diffLevels(oldXp: number, newXp: number): LevelTransition {
  const oldLevel = calculateLevelFromXp(Math.max(0, oldXp));
  const newLevel = calculateLevelFromXp(Math.max(0, newXp));
  return {
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    levelsGained: Math.max(0, newLevel - oldLevel),
  };
}
