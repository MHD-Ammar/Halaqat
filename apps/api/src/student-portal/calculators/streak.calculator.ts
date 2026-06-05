export interface StreakInput {
  lastActivityDate: Date | null;
  currentStreak: number;
  today: Date;
}

export interface StreakResult {
  newStreak: number;
  wasContinued: boolean;
  wasReset: boolean;
  wasNoOp: boolean;
}

export function computeStreak(input: StreakInput): StreakResult {
  const { lastActivityDate, currentStreak, today } = input;
  const todayStr = today.toISOString().split("T")[0]!;

  if (!lastActivityDate) {
    return { newStreak: 1, wasContinued: false, wasReset: false, wasNoOp: false };
  }

  const lastStr = lastActivityDate.toISOString().split("T")[0]!;

  if (lastStr === todayStr) {
    return { newStreak: currentStreak, wasContinued: false, wasReset: false, wasNoOp: true };
  }

  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;

  if (lastStr === yesterdayStr) {
    return { newStreak: currentStreak + 1, wasContinued: true, wasReset: false, wasNoOp: false };
  }

  return { newStreak: 1, wasContinued: false, wasReset: true, wasNoOp: false };
}
