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

import { CurriculumService, CachedSurah } from "./curriculum.service";

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

  /**
   * Get Surah info by page number (uses in-memory cache)
   * GET /api/curriculum/by-page/:pageNumber
   */
  @Get("by-page/:pageNumber")
  findSurahByPage(@Param("pageNumber", ParseIntPipe) pageNumber: number): CachedSurah {
    if (pageNumber < 1 || pageNumber > 604) {
      throw new NotFoundException(`Page ${pageNumber} is outside valid range (1-604)`);
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
  getAllSurahsWithPages(): CachedSurah[] {
    return this.curriculumService.getAllCachedSurahs();
  }
}
