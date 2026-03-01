/**
 * PointRule Seeder Data
 *
 * Default point rule configurations.
 */

export interface PointRuleSeedData {
  key: string;
  description: string;
  points: number;
  isSystem?: boolean;
  isVisibleToTeacher?: boolean;
}

/**
 * Default point rules for the gamification system
 */
export const POINT_RULE_DATA: PointRuleSeedData[] = [
  // Recitation-based points (System only)
  { 
    key: "RECITATION_PAGE", 
    description: "Points per page of recitation", 
    points: 5, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "RECITATION_EXCELLENT", 
    description: "Points for excellent recitation with no mistakes", 
    points: 5, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "RECITATION_VERY_GOOD", 
    description: "Points for very good recitation with few mistakes", 
    points: 3, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "RECITATION_GOOD", 
    description: "Points for good recitation", 
    points: 1, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "RECITATION_ACCEPTABLE", 
    description: "Points for acceptable recitation", 
    points: 0, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "RECITATION_POOR", 
    description: "Points for poor recitation (encouragement only)", 
    points: 0, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },

  // Recitation XP (System only, used for gamification leveling)
  { 
    key: "XP_RECITATION_EXCELLENT", 
    description: "XP for excellent recitation with no mistakes", 
    points: 50, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "XP_RECITATION_VERY_GOOD", 
    description: "XP for very good recitation with few mistakes", 
    points: 40, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "XP_RECITATION_GOOD", 
    description: "XP for good recitation", 
    points: 30, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "XP_RECITATION_ACCEPTABLE", 
    description: "XP for acceptable recitation", 
    points: 15, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "XP_RECITATION_POOR", 
    description: "XP for poor recitation (encouragement only)", 
    points: 10, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },


  // Attendance-based points (System only)
  { 
    key: "ATTENDANCE_ON_TIME", 
    description: "حضور في الوقت", 
    points: 5, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "ATTENDANCE_LATE", 
    description: "حضور متأخر", 
    points: 2, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "ATTENDANCE_ABSENT", 
    description: "غياب", 
    points: 0, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "ATTENDANCE_EXCUSED", 
    description: "غياب بعذر", 
    points: 0, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },

  // Manual Behavior Examples (System defined, but visible to teacher)
  { 
    key: "BEHAVIOR_BAD", 
    description: "شغب / سوء سلوك", 
    points: -5, 
    isSystem: true, 
    isVisibleToTeacher: true 
  },

  // Exam-based points (System only)
  { 
    key: "EXAM_EXCELLENT", 
    description: "Points for excellent exam performance (Full Mark)", 
    points: 20, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
  { 
    key: "EXAM_GOOD", 
    description: "Points for good exam performance", 
    points: 15, 
    isSystem: true, 
    isVisibleToTeacher: false 
  },
];
