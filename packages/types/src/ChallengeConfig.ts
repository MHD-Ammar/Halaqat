/**
 * Challenge Form Configuration
 *
 * Single source of truth for daily challenge form definitions and scoring rules.
 * Used by both the API (for XP calculation & Excel export) and the Web (for form rendering).
 *
 * Supported question types: GRID, BOOLEAN, NUMBER
 */

// ─── Types ───────────────────────────────────────────────────────────────────

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
  min?: number;
  step?: number;
  defaultValue?: number;
  xpYes?: number;
  xpNo?: number;
}

export interface QuestionScoringConfig {
  type: "GRID" | "BOOLEAN" | "NUMBER";
  xpMap?: Record<string, number>; // GRID: column value → XP
  xpYes?: number;                 // BOOLEAN: XP for true
  xpNo?: number;                  // BOOLEAN: XP for false
  multiplier?: number;            // NUMBER: XP per unit
  max?: number;                   // NUMBER: max value cap
}

export interface CampaignConfig {
  submitted_xp: number;
  questions: Record<string, QuestionScoringConfig>;
}

// ─── Ramadan Form Definition ─────────────────────────────────────────────────

export const RAMADAN_FORM: FormQuestion[] = [
  {
    id: "prayers",
    title: "الفرائض",
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
    xpYes: 50,
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
    step: 2,
    min: 0,
    max: 20,
    multiplier: 15,
  },
  {
    id: "sun_rise",
    title: "جلسة الشروق",
    description: "جلست بعد الفجر إلى طلوع الشمس",
    type: "BOOLEAN",
    xpYes: 50,
    xpNo: 0,
  },
  {
    id: "quran_hifz",
    title: "كم صفحة جديدة حفظت اليوم؟",
    description: "الواجب صفحتين على الأقل",
    type: "NUMBER",
    multiplier: 20,
    max: 20,
    min: 0,
  },
  {
    id: "quran_juz",
    title: "كم جزء قرأت اليوم؟",
    type: "NUMBER",
    multiplier: 40,
    min: 0,
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
    min: 0,
    max: 10,
    defaultValue: 10,
  },
];

// ─── Campaign Scoring Configs ────────────────────────────────────────────────

export const CAMPAIGN_CONFIGS: Record<string, CampaignConfig> = {
  ramadan: {
    submitted_xp: 1,
    questions: {
      prayers: { type: "GRID", xpMap: { mosque: 15, solo: 5 } },
      sunnah: { type: "GRID", xpMap: { yes: 8, no: 0 } },
      wird: { type: "BOOLEAN", xpYes: 50, xpNo: 0 },
      taraweeh: { type: "BOOLEAN", xpYes: 30, xpNo: 0 },
      tahajud: { type: "NUMBER", multiplier: 15, max: 20 },
      sun_rise: { type: "BOOLEAN", xpYes: 50, xpNo: 0 },
      quran_hifz: { type: "NUMBER", multiplier: 20, max: 20 },
      quran_juz: { type: "NUMBER", multiplier: 40, max: 30 },
      sadaqa: { type: "BOOLEAN", xpYes: 20, xpNo: 0 },
      doaa: { type: "BOOLEAN", xpYes: 15, xpNo: 0 },
      bir_parents: { type: "NUMBER", multiplier: 10, max: 10 },
    },
  },
  // Future campaigns can be added here
};

// ─── Campaign Form Registry ─────────────────────────────────────────────────

/** Map of campaignKey → FormQuestion[] for rendering and export */
export const CAMPAIGN_FORMS: Record<string, FormQuestion[]> = {
  ramadan: RAMADAN_FORM,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getCampaignConfig = (campaignKey: string): CampaignConfig | undefined => {
  return CAMPAIGN_CONFIGS[campaignKey] || CAMPAIGN_CONFIGS["ramadan"];
};

export const getCampaignForm = (campaignKey: string): FormQuestion[] => {
  return CAMPAIGN_FORMS[campaignKey] || CAMPAIGN_FORMS["ramadan"] || [];
};
