/**
 * Auth Constants
 *
 * Centralised values for authentication and security configuration.
 * Actual secrets (JWT_SECRET, etc.) come from environment variables via
 * the ConfigService — this file holds non-secret numeric/string constants only.
 */

/** bcrypt salt rounds for password hashing */
export const BCRYPT_ROUNDS = 10;

/** Minimum allowed password length */
export const PASSWORD_MIN_LENGTH = 8;

/** Maximum failed login attempts before a human-facing warning (not enforced in DB yet) */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Default JWT access-token expiry */
export const JWT_ACCESS_EXPIRY = "1d";

/** Default JWT refresh-token expiry */
export const JWT_REFRESH_EXPIRY = "30d";

/** Cookie name for the access token (must match frontend TOKEN_COOKIE_NAME) */
export const TOKEN_COOKIE_NAME = "token";
