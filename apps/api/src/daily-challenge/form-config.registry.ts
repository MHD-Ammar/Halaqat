/**
 * Form Config Registry
 *
 * Stores scoring rules for different campaigns.
 * The service looks up the config based on the campaignKey.
 */

export const CAMPAIGN_CONFIGS: Record<string, any> = {
  ramadan: {
    submitted_xp: 1, // Base XP for just submitting
    prayers: {
      mosque: 10,
      home_group: 7,
      solo: 3,
      missed: 0,
    },
    quran: {
      multiplier: 5, // XP per page
      max_pages: 60, // Limit to prevent abuse
    },
    taraweeh: {
      yes: 20,
      no: 0,
    },
  },
  // Future campaigns can be added here
  // summer_2025: { ... }
};

export const getCampaignConfig = (campaignKey: string) => {
  return CAMPAIGN_CONFIGS[campaignKey] || CAMPAIGN_CONFIGS["ramadan"];
};
