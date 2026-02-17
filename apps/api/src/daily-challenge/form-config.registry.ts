/**
 * Form Config Registry
 *
 * Stores scoring rules for different campaigns.
 * The service looks up the config based on the campaignKey.
 *
 * Each question config mirrors the frontend form definition.
 * Supported types: GRID, BOOLEAN, NUMBER
 */

export interface QuestionConfig {
  type: "GRID" | "BOOLEAN" | "NUMBER";
  xpMap?: Record<string, number>; // GRID: column value → XP
  xpYes?: number;                 // BOOLEAN: XP for true
  xpNo?: number;                  // BOOLEAN: XP for false
  multiplier?: number;            // NUMBER: XP per unit
  max?: number;                   // NUMBER: max value cap
}

export interface CampaignConfig {
  submitted_xp: number;
  questions: Record<string, QuestionConfig>;
}

export const CAMPAIGN_CONFIGS: Record<string, CampaignConfig> = {
  ramadan: {
    submitted_xp: 1, // Base XP for just submitting
    questions: {
      prayers: { type: "GRID", xpMap: { mosque: 15, solo: 5 } },
      sunnah: { type: "GRID", xpMap: { yes: 8, no: 0 } },
      wird: { type: "BOOLEAN", xpYes: 25, xpNo: 0 },
      taraweeh: { type: "BOOLEAN", xpYes: 30, xpNo: 0 },
      tahajud: { type: "NUMBER", multiplier: 15, max: 20 },
      sun_rise: { type: "BOOLEAN", xpYes: 35, xpNo: 0 },
      quran_hifz: { type: "NUMBER", multiplier: 20, max: 20 },
      quran_juz: { type: "NUMBER", multiplier: 40, max: 30 },
      sadaqa: { type: "BOOLEAN", xpYes: 20, xpNo: 0 },
      doaa: { type: "BOOLEAN", xpYes: 15, xpNo: 0 },
      bir_parents: { type: "NUMBER", multiplier: 10, max: 10 },
    },
  },
  // Future campaigns can be added here
  // summer_2025: { submitted_xp: 1, questions: { ... } }
};

export const getCampaignConfig = (campaignKey: string): CampaignConfig | undefined => {
  return CAMPAIGN_CONFIGS[campaignKey] || CAMPAIGN_CONFIGS["ramadan"];
};
