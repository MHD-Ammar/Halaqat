import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { DailyChallengeService } from "./daily-challenge.service";
import { SubmitDailyChallengeDto } from "./dto/submit-daily-challenge.dto";

@ApiTags("Daily Challenge")
@Controller("daily-challenge")
export class DailyChallengeController {
  constructor(private readonly challengeService: DailyChallengeService) {}

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
}
