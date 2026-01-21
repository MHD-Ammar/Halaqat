/**
 * AppController - Main Application Controller
 *
 * Handles root-level routes for the API.
 */

import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

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

@ApiTags("Health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint
   * @returns Health status and available user roles
   */
  @Get()
  @ApiOperation({
    summary: "Health check",
    description: "Returns API health status and available user roles",
  })
  @ApiResponse({ status: 200, description: "API is healthy" })
  getHealth(): HealthCheckResponse {
    return this.appService.getHealth();
  }
}
