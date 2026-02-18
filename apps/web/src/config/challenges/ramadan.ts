export type QuestionType = "BOOLEAN" | "NUMBER" | "SELECT" | "GRID";

export interface FormQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  rows?: string[];
  columns?: { label: string; value: string; xp: number }[];
  multiplier?: number;
  max?: number;
  xpYes?: number;
  xpNo?: number;
}

export const RAMADAN_FORM: FormQuestion[] = [
  {
    id: "prayers",
    title: "الفرائض والوتر",
    type: "GRID",
    rows: ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"],
    columns: [
      { label: "جماعة (المسجد)", value: "mosque", xp: 15 },
      { label: "فرد", value: "solo", xp: 5 },
    ],
  },
  {
    id: "sunnah",
    title: "السنن الرواتب",
    type: "GRID",
    rows: ["ركعتان قبل الفجر", "أربع ركعات الضحى", "أربع ركعات قبل الظهر", "ركعتان بعد الظهر", "ركعتان بعد المغرب", "ركعتان بعد العشاء", "الوتر"],
    columns: [
      { label: "صليتها ولله الحمد", value: "yes", xp: 8 },
      { label: "لم أصلها", value: "no", xp: 0 },
    ],
  },
  {
    id: "wird",
    title: "هل أنهيت وردك اليوم؟",
    description: "100 أستغفار - 200 صلاة على النبي صلى الله عليه وسلم - 1000 لا إله إلا الله",
    type: "BOOLEAN",
    xpYes: 25,
    xpNo: 0,
  },
  {
    id: "taraweeh",
    title: "هل صليت التراويح؟",
    type: "BOOLEAN",
    xpYes: 30,
    xpNo: 0,
  },
  {
    id: "tahajud",
    title: "كم ركعة تهجد صليت اليوم؟",
    type: "NUMBER",
    multiplier: 15,
    max: 20,
  },
  {
    id: "sun_rise",
    title: "جلسة الشروق",
    description: "جلست بعد الفجر إلى طلوع الشمس",
    type: "BOOLEAN",
    xpYes: 35,
    xpNo: 0,
  },
  {
    id: "quran_hifz",
    title: "كم صفحة جديدة حفظت اليوم؟",
    description: "الواجب صفحتين على الأقل",
    type: "NUMBER",
    multiplier: 20,
    max: 20, 
  },
  {
    id: "quran_juz",
    title: "كم جزء قرأت اليوم؟",
    type: "NUMBER",
    multiplier: 40,
    max: 30, 
  },
  {
    id: "sadaqa",
    title: "هل تصدقت اليوم؟",
    type: "BOOLEAN",
    xpYes: 20,
    xpNo: 0,
  },
  {
    id: "doaa",
    title: "هل دعوت للمسلمين بظهر الغيب؟",
    type: "BOOLEAN",
    xpYes: 15,
    xpNo: 0,
  },
  {
    id: "bir_parents",
    title: "تقييم الوالدين لبرك اليوم",
    type: "NUMBER",
    multiplier: 10,
    max: 10,
  },
];