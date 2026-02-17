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
