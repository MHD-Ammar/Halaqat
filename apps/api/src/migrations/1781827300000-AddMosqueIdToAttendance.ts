import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Denormalizes `mosque_id` onto the `attendance` table.
 *
 * Backfilled from the parent SESSION (attendance.session_id is NOT NULL with a
 * CASCADE FK, and session.mosque_id is NOT NULL) — this mirrors the runtime write
 * path, which sets mosque_id from `session.mosqueId`. The column is added nullable,
 * backfilled, then promoted to NOT NULL, so it is safe on empty or populated tables.
 */
export class AddMosqueIdToAttendance1781827300000
  implements MigrationInterface
{
  name = "AddMosqueIdToAttendance1781827300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fail fast instead of queueing behind a conflicting lock — prevents a stuck
    // migration from cascading into an outage once this table holds real data.
    // Scoped to this migration's transaction, so it never leaks to the pool.
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);

    await queryRunner.query(
      `ALTER TABLE "attendance" ADD "mosque_id" uuid`,
    );

    // Backfill from the owning session (same source the application uses).
    await queryRunner.query(`
      UPDATE "attendance" AS a
      SET "mosque_id" = se."mosque_id"
      FROM "session" AS se
      WHERE a."session_id" = se."id"
    `);

    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "mosque_id" SET NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "attendance"
      ADD CONSTRAINT "FK_attendance_mosque"
      FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_mosque_created"
      ON "attendance" ("mosque_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Unqualified + IF EXISTS: mirrors the unqualified CREATE in up() (schema is
    // resolved via search_path) and keeps rollback idempotent.
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_attendance_mosque_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_attendance_mosque"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN IF EXISTS "mosque_id"`,
    );
  }
}
