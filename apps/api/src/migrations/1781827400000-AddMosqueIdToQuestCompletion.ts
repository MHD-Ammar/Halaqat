import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Denormalizes `mosque_id` onto the `quest_completion` table.
 *
 * Backfilled from the owning STUDENT (student_id is NOT NULL with a CASCADE FK and
 * student.mosque_id is NOT NULL), mirroring the runtime write path. The column is
 * added nullable, backfilled, then promoted to NOT NULL — safe on empty or populated
 * tables. QuestCompletion has no `created_at`, so the read index uses `completed_at`
 * (the column the mosque activity feed orders by).
 */
export class AddMosqueIdToQuestCompletion1781827400000
  implements MigrationInterface
{
  name = "AddMosqueIdToQuestCompletion1781827400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fail fast instead of queueing behind a conflicting lock — prevents a stuck
    // migration from cascading into an outage once this table holds real data.
    // Scoped to this migration's transaction, so it never leaks to the pool.
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);

    await queryRunner.query(
      `ALTER TABLE "quest_completion" ADD "mosque_id" uuid`,
    );

    await queryRunner.query(`
      UPDATE "quest_completion" AS qc
      SET "mosque_id" = s."mosque_id"
      FROM "student" AS s
      WHERE qc."student_id" = s."id"
    `);

    await queryRunner.query(
      `ALTER TABLE "quest_completion" ALTER COLUMN "mosque_id" SET NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "quest_completion"
      ADD CONSTRAINT "FK_quest_completion_mosque"
      FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quest_completion_mosque_completed"
      ON "quest_completion" ("mosque_id", "completed_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Unqualified + IF EXISTS: mirrors the unqualified CREATE in up() (schema is
    // resolved via search_path) and keeps rollback idempotent.
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quest_completion_mosque_completed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quest_completion" DROP CONSTRAINT IF EXISTS "FK_quest_completion_mosque"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quest_completion" DROP COLUMN IF EXISTS "mosque_id"`,
    );
  }
}
