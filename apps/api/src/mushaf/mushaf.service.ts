/**
 * Mushaf Service
 *
 * Business logic for persisting Mushaf reading state and recitation mistakes.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { BulkCreateMistakesDto } from "./dto/bulk-create-mistakes.dto";
import { GetMistakesQueryDto } from "./dto/get-mistakes-query.dto";
import { UpdateMushafStateDto } from "./dto/update-mushaf-state.dto";
import { RecitationMistake } from "./entities/recitation-mistake.entity";
import { StudentMushafState } from "./entities/student-mushaf-state.entity";

@Injectable()
export class MushafService {
  constructor(
    @InjectRepository(StudentMushafState)
    private stateRepo: Repository<StudentMushafState>,
    @InjectRepository(RecitationMistake)
    private mistakeRepo: Repository<RecitationMistake>
  ) {}

  // ── Mushaf State ────────────────────────────────────────────────

  /**
   * Get or create the student's Mushaf state.
   * If no state exists, creates one with page 1 as default.
   */
  async getState(studentId: string): Promise<StudentMushafState> {
    let state = await this.stateRepo.findOne({ where: { studentId } });

    if (!state) {
      state = this.stateRepo.create({
        studentId,
        lastPageNumber: 1,
      });
      await this.stateRepo.save(state);
    }

    return state;
  }

  /**
   * Update the student's Mushaf reading position.
   * Upserts — creates if not exists, updates if exists.
   */
  async updateState(
    studentId: string,
    dto: UpdateMushafStateDto
  ): Promise<StudentMushafState> {
    let state = await this.stateRepo.findOne({ where: { studentId } });

    if (!state) {
      state = this.stateRepo.create({
        studentId,
        lastPageNumber: dto.pageNumber,
        lastSurahNumber: dto.surahNumber ?? null,
        lastAyahNumber: dto.ayahNumber ?? null,
      });
    } else {
      state.lastPageNumber = dto.pageNumber;
      state.lastSurahNumber = dto.surahNumber ?? state.lastSurahNumber;
      state.lastAyahNumber = dto.ayahNumber ?? state.lastAyahNumber;
    }

    return this.stateRepo.save(state);
  }

  // ── Recitation Mistakes ─────────────────────────────────────────

  /**
   * Get all mistakes for a student, optionally filtered by page or surah.
   */
  async getMistakes(
    studentId: string,
    query: GetMistakesQueryDto
  ): Promise<RecitationMistake[]> {
    const where: Record<string, unknown> = { studentId };

    if (query.pageNumber) {
      where.pageNumber = query.pageNumber;
    }
    if (query.surahNumber) {
      where.surahNumber = query.surahNumber;
    }

    return this.mistakeRepo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Bulk-insert word-level mistakes for a recitation session.
   * Used by the Teacher Assessor.
   */
  async bulkCreateMistakes(
    dto: BulkCreateMistakesDto
  ): Promise<{ count: number; mistakes: RecitationMistake[] }> {
    const entities = dto.mistakes.map((item) =>
      this.mistakeRepo.create({
        recitationId: dto.recitationId ?? null,
        studentId: dto.studentId,
        wordLocation: item.wordLocation,
        pageNumber: item.pageNumber,
        surahNumber: item.surahNumber,
        ayahNumber: item.ayahNumber,
        wordPosition: item.wordPosition,
        mistakeType: item.mistakeType,
        notes: item.notes ?? null,
      })
    );

    const saved = await this.mistakeRepo.save(entities);

    return {
      count: saved.length,
      mistakes: saved,
    };
  }

  /**
   * Delete a single mistake by ID.
   * Soft-deletes (uses deletedAt from BaseEntity).
   */
  async deleteMistake(mistakeId: string): Promise<void> {
    const mistake = await this.mistakeRepo.findOne({
      where: { id: mistakeId },
    });

    if (!mistake) {
      throw new NotFoundException(`Mistake with ID ${mistakeId} not found`);
    }

    await this.mistakeRepo.softRemove(mistake);
  }
}
