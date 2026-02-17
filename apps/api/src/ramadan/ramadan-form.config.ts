/**
 * Server-side configuration for Ramadan Form Scoring
 * This must match the frontend logic or be the source of truth.
 */

export const RAMADAN_FORM_CONFIG = {
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
};
