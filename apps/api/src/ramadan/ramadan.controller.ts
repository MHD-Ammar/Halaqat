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

import { SubmitRamadanDto } from "./dto/submit-ramadan.dto";
import { RamadanService } from "./ramadan.service";

@ApiTags("Ramadan Challenge")
@Controller("ramadan")
export class RamadanController {
  constructor(private readonly ramadanService: RamadanService) {}

  @Get("circles")
  @ApiOperation({
    summary: "List circles for a mosque (Public)",
    description: "Accepts ?mosqueId=... or defaults to the first mosque",
  })
  async getCircles(@Query("mosqueId") mosqueId?: string) {
    const targetMosqueId =
      mosqueId || (await this.ramadanService.findFirstMosqueId());

    if (!targetMosqueId) {
      throw new NotFoundException("No mosque found");
    }

    return this.ramadanService.getCircles(targetMosqueId);
  }

  @Get("students/:circleId")
  @ApiOperation({ summary: "List students in a circle (Public)" })
  async getStudents(@Param("circleId") circleId: string) {
    return this.ramadanService.getStudents(circleId);
  }

  @Get("student-info/:studentId")
  @ApiOperation({ summary: "Get student info & streak (Public)" })
  async getStudentInfo(@Param("studentId") studentId: string) {
    return this.ramadanService.getStudentInfo(studentId);
  }

  @Post("submit")
  @ApiOperation({ summary: "Submit daily challenge (Public)" })
  async submit(@Body() dto: SubmitRamadanDto) {
    return this.ramadanService.submit(dto);
  }

  @Get("leaderboard")
  @ApiOperation({
    summary: "Get Leaderboard (Public)",
    description: "Accepts ?mosqueId=... or defaults to the first mosque",
  })
  async getLeaderboard(@Query("mosqueId") mosqueId?: string) {
    const targetMosqueId =
      mosqueId || (await this.ramadanService.findFirstMosqueId());

    if (!targetMosqueId) {
      throw new NotFoundException("No mosque found");
    }

    return this.ramadanService.getLeaderboard(targetMosqueId);
  }
}
