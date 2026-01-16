/**
 * AppController - Main Application Controller
 *
 * Handles root-level routes for the API.
 */

import { Controller, Get } from "@nestjs/common";

import { UserRole } from "@halaqat/types";

import { AppService } from "./app.service";

/**
 * Response type for the health check endpoint
 */
interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  availableRoles: UserRole[];
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint
   * @returns Health status and available user roles
   */
  @Get()
  getHealth(): HealthCheckResponse {
    return this.appService.getHealth();
  }
}
