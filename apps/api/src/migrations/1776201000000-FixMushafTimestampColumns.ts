import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FixMushafTimestampColumns
 *
 * Idempotent corrective migration for the Mushaf tables.
 *
 * Problems addressed:
 *  1. recitation_id was originally created as NOT NULL — entity now requires nullable.
 *  2. Timestamp columns may have been created as camelCase ("createdAt") in some
 *     environments before SnakeNamingStrategy was enforced.  The conditional renames
 *     are safe to run whether columns are already snake_case or still camelCase.
 */
export class FixMushafTimestampColumns1776201000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── 1. Make recitation_id nullable ────────────────────────────────────────
    // DROP NOT NULL is a no-op in PostgreSQL if the column is already nullable,
    // so this is safe to run on any DB state.
    await queryRunner.query(`
      ALTER TABLE "recitation_mistake"
        ALTER COLUMN "recitation_id" DROP NOT NULL
    `);

    // ── 2. Conditionally rename camelCase timestamp columns → snake_case ──────
    // Each block checks whether the camelCase column still exists before renaming.
    // If the column is already named correctly the block is a no-op.

    // student_mushaf_state
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'student_mushaf_state'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "student_mushaf_state" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'student_mushaf_state'
            AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE "student_mushaf_state" RENAME COLUMN "updatedAt" TO "updated_at";
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'student_mushaf_state'
            AND column_name = 'deletedAt'
        ) THEN
          ALTER TABLE "student_mushaf_state" RENAME COLUMN "deletedAt" TO "deleted_at";
          -- Recreate the soft-delete index under the corrected column name
          DROP INDEX IF EXISTS "IDX_student_mushaf_state_deleted";
          CREATE INDEX "IDX_student_mushaf_state_deleted"
            ON "student_mushaf_state" ("deleted_at");
        END IF;
      END $$
    `);

    // recitation_mistake
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'recitation_mistake'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "recitation_mistake" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'recitation_mistake'
            AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE "recitation_mistake" RENAME COLUMN "updatedAt" TO "updated_at";
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'recitation_mistake'
            AND column_name = 'deletedAt'
        ) THEN
          ALTER TABLE "recitation_mistake" RENAME COLUMN "deletedAt" TO "deleted_at";
          -- Recreate the soft-delete index under the corrected column name
          DROP INDEX IF EXISTS "IDX_recitation_mistake_deleted";
          CREATE INDEX "IDX_recitation_mistake_deleted"
            ON "recitation_mistake" ("deleted_at");
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Restore NOT NULL on recitation_id ─────────────────────────────────
    // WARNING: will fail if any row has NULL recitation_id at rollback time.
    await queryRunner.query(`
      ALTER TABLE "recitation_mistake"
        ALTER COLUMN "recitation_id" SET NOT NULL
    `);

    // ── 2. Rename snake_case columns back to camelCase ────────────────────────

    // recitation_mistake
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'recitation_mistake'
            AND column_name = 'deleted_at'
        ) THEN
          DROP INDEX IF EXISTS "IDX_recitation_mistake_deleted";
          ALTER TABLE "recitation_mistake" RENAME COLUMN "deleted_at" TO "deletedAt";
          CREATE INDEX "IDX_recitation_mistake_deleted"
            ON "recitation_mistake" ("deletedAt");
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'recitation_mistake'
            AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE "recitation_mistake" RENAME COLUMN "updated_at" TO "updatedAt";
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'recitation_mistake'
            AND column_name = 'created_at'
        ) THEN
          ALTER TABLE "recitation_mistake" RENAME COLUMN "created_at" TO "createdAt";
        END IF;
      END $$
    `);

    // student_mushaf_state
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'student_mushaf_state'
            AND column_name = 'deleted_at'
        ) THEN
          DROP INDEX IF EXISTS "IDX_student_mushaf_state_deleted";
          ALTER TABLE "student_mushaf_state" RENAME COLUMN "deleted_at" TO "deletedAt";
          CREATE INDEX "IDX_student_mushaf_state_deleted"
            ON "student_mushaf_state" ("deletedAt");
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'student_mushaf_state'
            AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE "student_mushaf_state" RENAME COLUMN "updated_at" TO "updatedAt";
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name  = 'student_mushaf_state'
            AND column_name = 'created_at'
        ) THEN
          ALTER TABLE "student_mushaf_state" RENAME COLUMN "created_at" TO "createdAt";
        END IF;
      END $$
    `);
  }
}
