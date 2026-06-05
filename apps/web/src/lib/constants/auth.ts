/**
 * Auth Constants (Frontend)
 *
 * Cookie and session-related constants for the web app.
 * TOKEN_COOKIE_NAME must match apps/api/src/common/constants/auth.constants.ts.
 */

/** Name of the JWT cookie set on login */
export const TOKEN_COOKIE_NAME = "token";

/** Days to keep the cookie when "remember me" is checked */
export const REMEMBER_ME_DAYS = 30;

/** Default session duration in days (no remember-me) */
export const SESSION_DAYS = 1;
