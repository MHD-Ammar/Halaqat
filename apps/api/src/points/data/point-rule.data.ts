/**
 * PointRule Seeder Data
 *
 * Default point rule configurations.
 */

export interface PointRuleSeedData {
  key: string;
  description: string;
  points: number;
}

/**
 * Default point rules for the gamification system
 */
export const POINT_RULE_DATA: PointRuleSeedData[] = [
  // Recitation-based points
  { key: "RECITATION_EXCELLENT", description: "Points for excellent recitation with no mistakes", points: 5 },
  { key: "RECITATION_VERY_GOOD", description: "Points for very good recitation with few mistakes", points: 3 },
  { key: "RECITATION_GOOD", description: "Points for good recitation", points: 1 },
  { key: "RECITATION_ACCEPTABLE", description: "Points for acceptable recitation", points: 0 },
  { key: "RECITATION_POOR", description: "Points for poor recitation (encouragement only)", points: 0 },

  // Attendance-based points
  { key: "ATTENDANCE_PRESENT", description: "Points for being present in the session", points: 2 },
  { key: "ATTENDANCE_ON_TIME", description: "Bonus points for arriving on time", points: 1 },
];
