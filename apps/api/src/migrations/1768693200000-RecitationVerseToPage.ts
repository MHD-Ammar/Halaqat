import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Convert Recitation from Verse-based to Page-based
 *
 * This migration:
 * 1. Drops old verse columns (start_verse, end_verse)
 * 2. Adds page_number column (1-604)
 * 3. Makes surah_id nullable
 *
 * WARNING: This clears existing recitation data!
 */
export class RecitationVerseToPage1768693200000 implements MigrationInterface {
  name = "RecitationVerseToPage1768693200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, drop all existing recitation data (acceptable at dev stage)
    await queryRunner.query(`DELETE FROM "recitation"`);

    // Drop old verse columns
    await queryRunner.query(`ALTER TABLE "recitation" DROP COLUMN IF EXISTS "start_verse"`);
    await queryRunner.query(`ALTER TABLE "recitation" DROP COLUMN IF EXISTS "end_verse"`);

    // Add new page_number column
    await queryRunner.query(`ALTER TABLE "recitation" ADD "page_number" integer NOT NULL DEFAULT 1`);

    // Remove the default after adding
    await queryRunner.query(`ALTER TABLE "recitation" ALTER COLUMN "page_number" DROP DEFAULT`);

    // Add index on page_number
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_recitation_page_number" ON "recitation" ("page_number")`);

    // Make surah_id nullable
    await queryRunner.query(`ALTER TABLE "recitation" ALTER COLUMN "surah_id" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop page_number index and column
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recitation_page_number"`);
    await queryRunner.query(`ALTER TABLE "recitation" DROP COLUMN IF EXISTS "page_number"`);

    // Re-add verse columns
    await queryRunner.query(`ALTER TABLE "recitation" ADD "start_verse" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "recitation" ADD "end_verse" integer NOT NULL DEFAULT 1`);

    // Make surah_id required again
    await queryRunner.query(`ALTER TABLE "recitation" ALTER COLUMN "surah_id" SET NOT NULL`);
  }
}
