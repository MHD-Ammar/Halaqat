/**
 * Mosques Controller
 *
 * REST API endpoints for managing mosque information.
 */

import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { UpdateMosqueDto } from "./dto/update-mosque.dto";
import { MosquesService } from "./mosques.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Mosques")
@ApiBearerAuth("JWT-auth")
@Controller("mosques")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class MosquesController {
  constructor(private readonly mosquesService: MosquesService) {}

  /**
   * Get the current user's mosque details
   * GET /api/mosques/my-mosque
   */
  @Get("my-mosque")
  @ApiOperation({
    summary: "Get my mosque",
    description: "Get the current user's mosque information",
  })
  @ApiResponse({ status: 200, description: "Mosque details" })
  async getMyMosque(@CurrentUser() user: { mosqueId: string }) {
    const mosque = await this.mosquesService.findById(user.mosqueId);
    return {
      message: "Mosque retrieved successfully",
      data: mosque,
    };
  }

  /**
   * Update the current user's mosque
   * PATCH /api/mosques/my-mosque
   */
  @Patch("my-mosque")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update my mosque",
    description: "Update the current user's mosque information (Admin only)",
  })
  @ApiResponse({ status: 200, description: "Mosque updated successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "Mosque not found" })
  async updateMyMosque(
    @CurrentUser() user: { mosqueId: string },
    @Body() dto: UpdateMosqueDto,
  ) {
    const mosque = await this.mosquesService.updateMosque(user.mosqueId, dto);
    return {
      message: "Mosque updated successfully",
      data: mosque,
    };
  }
}
