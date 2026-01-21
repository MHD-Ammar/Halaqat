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
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";

import { CurriculumService, CachedSurah } from "./curriculum.service";

@ApiTags("Curriculum")
@Controller("curriculum")
@UseInterceptors(ClassSerializerInterceptor)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /**
   * Get all Surahs sorted by number
   * GET /api/curriculum/surahs
   */
  @Get("surahs")
  @ApiOperation({
    summary: "Get all surahs",
    description: "Get all 114 surahs sorted by number",
  })
  @ApiResponse({ status: 200, description: "List of all surahs" })
  findAllSurahs() {
    return this.curriculumService.findAllSurahs();
  }

  /**
   * Get a single Surah by number
   * GET /api/curriculum/surahs/:number
   */
  @Get("surahs/:number")
  @ApiOperation({
    summary: "Get surah by number",
    description: "Get a single surah by its number (1-114)",
  })
  @ApiParam({ name: "number", description: "Surah number (1-114)" })
  @ApiResponse({ status: 200, description: "Surah details" })
  @ApiResponse({ status: 404, description: "Surah not found" })
  findSurahByNumber(@Param("number", ParseIntPipe) number: number) {
    return this.curriculumService.findSurahByNumber(number);
  }

  /**
   * Get Surah info by page number (uses in-memory cache)
   * GET /api/curriculum/by-page/:pageNumber
   */
  @Get("by-page/:pageNumber")
  @ApiOperation({
    summary: "Get surah by page",
    description: "Get surah info for a Madinah Mushaf page (1-604)",
  })
  @ApiParam({ name: "pageNumber", description: "Page number (1-604)" })
  @ApiResponse({ status: 200, description: "Surah that contains this page" })
  @ApiResponse({
    status: 404,
    description: "Page out of range or surah not found",
  })
  findSurahByPage(
    @Param("pageNumber", ParseIntPipe) pageNumber: number,
  ): CachedSurah {
    if (pageNumber < 1 || pageNumber > 604) {
      throw new NotFoundException(
        `Page ${pageNumber} is outside valid range (1-604)`,
      );
    }

    const surah = this.curriculumService.findSurahByPage(pageNumber);
    if (!surah) {
      throw new NotFoundException(`No surah found for page ${pageNumber}`);
    }

    return surah;
  }

  /**
   * Get all surahs with page ranges from cache (fast endpoint)
   * GET /api/curriculum/surahs-with-pages
   */
  @Get("surahs-with-pages")
  @ApiOperation({
    summary: "Get surahs with pages",
    description: "Get all surahs with start/end page numbers (cached)",
  })
  @ApiResponse({ status: 200, description: "List of surahs with page ranges" })
  getAllSurahsWithPages(): CachedSurah[] {
    return this.curriculumService.getAllCachedSurahs();
  }
}
