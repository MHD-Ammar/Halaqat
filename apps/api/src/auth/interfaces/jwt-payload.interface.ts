/**
 * JWT Payload Interface
 */

import { UserRole } from "@halaqat/types";

export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  
  /** User email */
  email: string;
  
  /** User role */
  role: UserRole;
}
