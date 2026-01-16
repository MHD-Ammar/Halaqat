/**
 * Roles Decorator
 *
 * Assigns required roles to a controller or route handler.
 * Used with RolesGuard to implement RBAC.
 */

import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@halaqat/types";

export const ROLES_KEY = "roles";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
