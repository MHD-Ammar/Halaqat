/**
 * AppService - Main Application Service
 *
 * Provides core business logic for the application.
 */

import { UserRole } from "@halaqat/types";
import { Injectable } from "@nestjs/common";


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
