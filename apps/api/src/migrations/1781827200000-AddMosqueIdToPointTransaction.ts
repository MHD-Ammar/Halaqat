import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Denormalizes `mosque_id` onto the `point_transaction` ledger.
 *
 * Rationale: every transaction already belongs to exactly one mosque (via its
 * student), but reaching it previously required a join through `student`. Carrying
 * mosque_id directly lets mosque-scoped analytics/leaderboards filter on an indexed
 * column and is a prerequisite for centralized tenant scoping later.
 *
 * Safety: the column is added NULLABLE, backfilled from the owning student, and only
 * then promoted to NOT NULL — so the migration is safe whether the table is empty or
 * already has rows. `student_id` is NOT NULL with a CASCADE FK, so 100% of rows have a
 * resolvable mosque and no orphan can exist.
 */
export class AddMosqueIdToPointTransaction1781827200000
  implements MigrationInterface
{
  name = "AddMosqueIdToPointTransaction1781827200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Add as NULLABLE first so any existing rows don't violate NOT NULL.
    await queryRunner.query(
      `ALTER TABLE "point_transaction" ADD "mosque_id" uuid`,
    );

    // 2) Backfill from the owning student. Covers every row (student_id is NOT NULL
    //    with an ON DELETE CASCADE FK); soft-deleted students still have a live row.
    await queryRunner.query(`
      UPDATE "point_transaction" AS pt
      SET "mosque_id" = s."mosque_id"
      FROM "student" AS s
      WHERE pt."student_id" = s."id"
    `);

    // 3) Every row is now populated -> enforce NOT NULL.
    await queryRunner.query(
      `ALTER TABLE "point_transaction" ALTER COLUMN "mosque_id" SET NOT NULL`,
    );

    // 4) FK to mosque, mirroring the student/session cascade semantics.
    await queryRunner.query(`
      ALTER TABLE "point_transaction"
      ADD CONSTRAINT "FK_point_transaction_mosque"
      FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 5) Composite index for mosque-scoped, time-ordered reads. The leftmost prefix
    //    (mosque_id) also serves plain mosque filters and backs the FK.
    await queryRunner.query(`
      CREATE INDEX "IDX_point_transaction_mosque_created"
      ON "point_transaction" ("mosque_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_point_transaction_mosque_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transaction" DROP CONSTRAINT "FK_point_transaction_mosque"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transaction" DROP COLUMN "mosque_id"`,
    );
  }
}
