/**
 * AppService - Main Application Service
 *
 * Provides core business logic for the application.
 */

import { Injectable } from "@nestjs/common";

import { UserRole } from "@halaqat/types";

/**
 * Response type for the health check
 */
interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  availableRoles: UserRole[];
}

@Injectable()
export class AppService {
  /**
   * Get the health status of the API
   * @returns Health check response with available user roles
   */
  getHealth(): HealthCheckResponse {
    return {
      status: "ok",
      message: "Halaqat API is running",
      timestamp: new Date().toISOString(),
      availableRoles: Object.values(UserRole),
    };
  }
}
