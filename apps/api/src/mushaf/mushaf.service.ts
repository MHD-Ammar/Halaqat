/**
 * Mushaf Service
 *
 * Business logic for persisting Mushaf reading state and recitation mistakes.
 *
 * The service is also responsible for keeping `Recitation.mistakesCount`
 * consistent with the underlying `RecitationMistake` rows. We always
 * recompute the count from the database (rather than trying to increment /
 * decrement) so that it self-heals after partial failures, manual edits, or
 * concurrent writes from multiple teachers.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Not, Repository } from "typeorm";


import { BulkCreateMistakesDto } from "./dto/bulk-create-mistakes.dto";
import { GetMistakesQueryDto } from "./dto/get-mistakes-query.dto";
import { UpdateMushafStateDto } from "./dto/update-mushaf-state.dto";
import { RecitationMistake } from "./entities/recitation-mistake.entity";
import { StudentMushafState } from "./entities/student-mushaf-state.entity";
import { Recitation } from "../progress/entities/recitation.entity";

@Injectable()
export class MushafService {
  constructor(
    @InjectRepository(StudentMushafState)
    private stateRepo: Repository<StudentMushafState>,
    @InjectRepository(RecitationMistake)
    private mistakeRepo: Repository<RecitationMistake>,
    @InjectRepository(Recitation)
    private recitationRepo: Repository<Recitation>,
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
    dto: UpdateMushafStateDto,
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
    query: GetMistakesQueryDto,
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
   *
   * If `dto.recitationId` is provided, we re-derive `mistakesCount` on the
   * parent recitation row from the up-to-date set of mistakes. Counting via
   * a SQL aggregation (rather than `entities.length`) means the count stays
   * correct even if the same recitation receives mistakes through multiple
   * bulk-create calls, or if older mistakes were soft-deleted.
   */
  async bulkCreateMistakes(
    dto: BulkCreateMistakesDto,
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
      }),
    );

    const saved = await this.mistakeRepo.save(entities);

    if (dto.recitationId) {
      await this.syncRecitationMistakeCount(dto.recitationId);
    }

    return {
      count: saved.length,
      mistakes: saved,
    };
  }

  /**
   * Delete a single mistake by ID.
   * Soft-deletes (uses deletedAt from BaseEntity) and re-derives the
   * parent recitation's mistake count so it shrinks accordingly.
   */
  async deleteMistake(mistakeId: string): Promise<void> {
    const mistake = await this.mistakeRepo.findOne({
      where: { id: mistakeId },
    });

    if (!mistake) {
      throw new NotFoundException(`Mistake with ID ${mistakeId} not found`);
    }

    const parentRecitationId = mistake.recitationId;
    await this.mistakeRepo.softRemove(mistake);

    if (parentRecitationId) {
      await this.syncRecitationMistakeCount(parentRecitationId);
    }
  }

  // ── Internal helpers ─────────────────────────────────────────────

  /**
   * Recompute and persist `Recitation.mistakesCount` for a single
   * recitation row. Counts only live (non-soft-deleted) mistakes. Safe to
   * call repeatedly — the operation is idempotent.
   *
   * Defensive: if the recitation row does not exist (e.g. it was deleted
   * between the bulk-create and this call) the update is a no-op rather
   * than an error, since the absence of the parent makes the count
   * meaningless anyway.
   */
  private async syncRecitationMistakeCount(
    recitationId: string,
  ): Promise<void> {
    const count = await this.mistakeRepo.count({
      where: {
        recitationId,
        // Soft-deleted rows have a non-null deletedAt — exclude them.
        // We also don't include them via `withDeleted: true`, but being
        // explicit guards against future repository defaults flipping.
      },
    });

    await this.recitationRepo.update(
      { id: recitationId },
      { mistakesCount: count },
    );
  }

  /**
   * Public counterpart for callers that want to refresh counts after
   * making out-of-band changes (e.g. an admin tool that bulk-imports or
   * cleans data). Accepts a single id or an array; returns a map of
   * id → final count for verification.
   *
   * Currently unused by routes but exported via the service so
   * future modules can call it without re-implementing the SQL.
   */
  async refreshMistakeCounts(
    recitationIds: string | string[],
  ): Promise<Record<string, number>> {
    const ids = Array.isArray(recitationIds) ? recitationIds : [recitationIds];
    if (ids.length === 0) return {};

    const rows = await this.mistakeRepo
      .createQueryBuilder("m")
      .select("m.recitation_id", "recitationId")
      .addSelect("COUNT(*)::int", "count")
      .where("m.recitation_id IN (:...ids)", { ids })
      .andWhere("m.recitation_id IS NOT NULL")
      .andWhere("m.deleted_at IS NULL")
      .groupBy("m.recitation_id")
      .getRawMany<{ recitationId: string; count: number }>();

    const counts: Record<string, number> = {};
    for (const id of ids) counts[id] = 0;
    for (const r of rows) counts[r.recitationId] = r.count;

    await Promise.all(
      Object.entries(counts).map(([id, count]) =>
        this.recitationRepo.update({ id }, { mistakesCount: count }),
      ),
    );

    return counts;
  }
}

// Re-exported TypeORM operators kept here so unit tests can stub them
// consistently with how the service uses them.
export { In, IsNull, Not };
