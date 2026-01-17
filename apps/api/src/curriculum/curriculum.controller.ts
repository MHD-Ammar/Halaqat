/**
 * Curriculum Controller
 *
 * Read-only API endpoints for curriculum data.
 */

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";

import { CurriculumService } from "./curriculum.service";

@Controller("curriculum")
@UseInterceptors(ClassSerializerInterceptor)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /**
   * Get all Surahs sorted by number
   * GET /api/curriculum/surahs
   *
   * Note: This data rarely changes, consider caching using @nestjs/cache-manager
   * Example: @UseInterceptors(CacheInterceptor) + @CacheTTL(3600)
   */
  @Get("surahs")
  findAllSurahs() {
    return this.curriculumService.findAllSurahs();
  }

  /**
   * Get a single Surah by number
   * GET /api/curriculum/surahs/:number
   */
  @Get("surahs/:number")
  findSurahByNumber(@Param("number", ParseIntPipe) number: number) {
    return this.curriculumService.findSurahByNumber(number);
  }
}
