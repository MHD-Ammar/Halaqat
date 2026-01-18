import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add startPage and endPage to Surah table
 *
 * Adds page range columns to track Madinah Mushaf page positions.
 */
export class AddSurahPageRanges1768700000000 implements MigrationInterface {
  name = "AddSurahPageRanges1768700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add startPage column with default
    await queryRunner.query(`
      ALTER TABLE "surah"
      ADD COLUMN IF NOT EXISTS "start_page" integer NOT NULL DEFAULT 1
    `);

    // Add endPage column with default
    await queryRunner.query(`
      ALTER TABLE "surah"
      ADD COLUMN IF NOT EXISTS "end_page" integer NOT NULL DEFAULT 1
    `);

    // Note: The actual page range values will be populated by the seeder
    // when the application starts
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "surah" DROP COLUMN IF EXISTS "end_page"`);
    await queryRunner.query(`ALTER TABLE "surah" DROP COLUMN IF EXISTS "start_page"`);
  }
}
