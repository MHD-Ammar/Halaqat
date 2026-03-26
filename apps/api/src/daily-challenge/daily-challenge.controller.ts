import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";

import { DailyChallengeService } from "./daily-challenge.service";
import { SubmitDailyChallengeDto } from "./dto/submit-daily-challenge.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Daily Challenge")
@Controller("daily-challenge")
export class DailyChallengeController {
  constructor(private readonly challengeService: DailyChallengeService) {}

  @Get("active-campaign")
  @ApiOperation({
    summary: "Get active campaign (Public)",
    description:
      "Returns the currently active campaign's form config for public/student forms (e.g. /ramadan). No auth required.",
  })
  async getActiveCampaign() {
    return this.challengeService.getActiveCampaign();
  }

  @Get("circles")
  @ApiOperation({
    summary: "List circles for a mosque (Public)",
    description: "Accepts ?mosqueId=... or defaults to the first mosque",
  })
  async getCircles(@Query("mosqueId") mosqueId?: string) {
    const targetMosqueId =
      mosqueId || (await this.challengeService.findFirstMosqueId());

    if (!targetMosqueId) {
      throw new NotFoundException("No mosque found");
    }

    return this.challengeService.getCircles(targetMosqueId);
  }

  @Get("students/:circleId")
  @ApiOperation({ summary: "List students in a circle (Public)" })
  async getStudents(@Param("circleId") circleId: string) {
    return this.challengeService.getStudents(circleId);
  }

  @Get("student-info/:studentId")
  @ApiOperation({ summary: "Get student info & streak (Public)" })
  async getStudentInfo(
    @Param("studentId") studentId: string,
    @Query("campaign") campaign: string = "ramadan",
  ) {
    return this.challengeService.getStudentInfo(studentId, campaign);
  }

  @Post("submit")
  @ApiOperation({ summary: "Submit daily challenge (Public)" })
  async submit(@Body() dto: SubmitDailyChallengeDto) {
    return this.challengeService.submit(dto);
  }

  @Get("submissions/weekly")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Get weekly submissions for a circle (Teacher)",
    description: "Returns all students in circle with their submissions for the specified date range",
  })
  async getWeeklySubmissions(
    @Query("circleId") circleId: string,
    @Query("startDate") startDate: string,
    @Query("campaign") campaign: string = "ramadan",
  ) {
    if (!circleId || !startDate) {
      throw new NotFoundException("circleId and startDate are required");
    }
    return this.challengeService.getWeeklySubmissions(circleId, startDate, campaign);
  }

  @Get("submission/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: "Get single submission details (Teacher)" })
  async getSubmission(@Param("id") id: string) {
    return this.challengeService.getSubmissionById(id);
  }

  @Get("leaderboard")
  @ApiOperation({
    summary: "Get Leaderboard (Public)",
    description: "Accepts ?mosqueId=... and ?campaign=... defaults to the first mosque and 'ramadan'",
  })
  async getLeaderboard(
    @Query("mosqueId") mosqueId?: string,
    @Query("campaign") campaign: string = "ramadan",
  ) {
    const targetMosqueId =
      mosqueId || (await this.challengeService.findFirstMosqueId());

    if (!targetMosqueId) {
      throw new NotFoundException("No mosque found");
    }

    return this.challengeService.getLeaderboard(targetMosqueId, campaign);
  }

  // ─── Admin Endpoints ─────────────────────────────────────────────────────

  @Get("export/excel")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Export submissions to Excel (Admin)",
    description: "Streams an .xlsx file with all submissions in the date range",
  })
  async exportToExcel(
    @Query("campaign") campaign: string = "ramadan",
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException("startDate and endDate are required");
    }

    const workbook = await this.challengeService.exportToExcel(
      campaign,
      startDate,
      endDate,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=submissions_${startDate}_${endDate}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get("submissions/admin-list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get paginated submissions for Admin Dashboard",
    description: "Paginates by students with their submissions in date range",
  })
  async getAdminSubmissionsList(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("campaign") campaign: string = "ramadan",
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException("startDate and endDate are required");
    }

    return this.challengeService.getAdminSubmissionsList(
      Number(page) || 1,
      Number(limit) || 20,
      startDate,
      endDate,
      campaign,
    );
  }

  @Patch("submissions/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Override Submission (Admin)",
    description: "Manually adjust a student's submission data or XP",
  })
  async overrideSubmission(
    @Param("id") id: string,
    @Body() dto: { submissionData?: Record<string, any>; xpEarned?: number },
  ) {
    return this.challengeService.overrideSubmission(id, dto);
  }

  @Post("campaigns/reset-streaks")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Reset Streaks (Admin)",
    description: "Bulk reset streaks to 0 for all students, optionally filtered by mosque or circle.",
  })
  async resetStreaks(@Body() dto: { mosqueId?: string; circleId?: string }) {
    return this.challengeService.resetStreaks(dto);
  }
}
