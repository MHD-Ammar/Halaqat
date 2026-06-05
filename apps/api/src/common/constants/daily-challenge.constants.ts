/**
 * Daily Challenge Constants
 *
 * Campaign key strings that map to the hardcoded legacy form configurations.
 * These must match the keys used in `getCampaignConfig()` in @halaqat/types.
 */

export const CAMPAIGN_KEYS = {
  RAMADAN: "ramadan",
  HAJJ:    "hajj",
} as const;

export type CampaignKey = (typeof CAMPAIGN_KEYS)[keyof typeof CAMPAIGN_KEYS];

/** XP awarded automatically on submission (before question scoring) */
export const SUBMISSION_BASE_XP = 10;
