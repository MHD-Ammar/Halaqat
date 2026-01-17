/**
 * Session Status Enum
 *
 * Status options for daily sessions.
 */

export enum SessionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

/**
 * Type guard to check if a value is a valid SessionStatus
 */
export function isSessionStatus(value: unknown): value is SessionStatus {
  return (
    typeof value === "string" &&
    Object.values(SessionStatus).includes(value as SessionStatus)
  );
}
