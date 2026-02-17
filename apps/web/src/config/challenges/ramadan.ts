export type QuestionType = "BOOLEAN" | "NUMBER" | "SELECT" | "GRID";

export interface FormQuestion {
  id: string;
  title: string;
  type: QuestionType;
  // For GRID
  rows?: string[];
  columns?: { label: string; value: string; xp: number }[];
  // For NUMBER
  multiplier?: number;
  max?: number;
  // For BOOLEAN
  xpYes?: number;
  xpNo?: number;
}

export const RAMADAN_FORM: FormQuestion[] = [
  {
    id: "prayers",
    title: "الفرائض والوتر",
    type: "GRID",
    rows: ["الفجر", "الظهر", "العصر", "المغرب", "العشاء", "الوتر"],
    columns: [
      { label: "جماعة في المسجد", value: "mosque", xp: 10 },
      { label: "جماعة في المنزل", value: "home_group", xp: 7 },
      { label: "فرد", value: "solo", xp: 3 },
    ],
  },
  {
    id: "quran_pages",
    title: "كم صفحة قرأت اليوم؟",
    type: "NUMBER",
    multiplier: 5, // 5 XP per page
    max: 60, // Cap reasonable input
  },
  {
    id: "taraweeh",
    title: "هل صليت التراويح؟",
    type: "BOOLEAN",
    xpYes: 20,
    xpNo: 0,
  },
];
