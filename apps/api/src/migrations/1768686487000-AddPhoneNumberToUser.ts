import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add phone_number column to user table
 *
 * This migration:
 * 1. Adds the phone_number column as nullable first
 * 2. Updates existing users with a placeholder phone number
 * 3. Makes the column NOT NULL
 */
export class AddPhoneNumberToUser1768686487000 implements MigrationInterface {
  name = "AddPhoneNumberToUser1768686487000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add the column as nullable first
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR(20)
    `);

    // Step 2: Update existing users with a placeholder phone number
    await queryRunner.query(`
      UPDATE "user"
      SET "phone_number" = '+0000000000'
      WHERE "phone_number" IS NULL
    `);

    // Step 3: Make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "phone_number" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the phone_number column
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "phone_number"
    `);
  }
}
