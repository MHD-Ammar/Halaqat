import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the TASHKEEL value to the existing `mistake_type_enum` Postgres enum.
 *
 * Postgres requires `ALTER TYPE ... ADD VALUE` to run outside a transaction
 * block in some versions, but inside a TypeORM migration the queryRunner
 * already manages the transaction. We use `IF NOT EXISTS` so the migration
 * is safely re-runnable.
 *
 * Down migration: Postgres does not support removing a value from an enum
 * type; the only safe rollback is to recreate the enum (which would require
 * re-mapping the column). We therefore make the down migration a no-op and
 * document the limitation rather than silently corrupting data.
 */
export class AddTashkeelToMistakeType1776210000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "mistake_type_enum" ADD VALUE IF NOT EXISTS 'TASHKEEL'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: Postgres does not support removing enum values without
    // recreating the type and re-mapping every row that depends on it.
    // If a true rollback is ever required, write a fresh migration that
    // (1) renames the existing type, (2) creates a new type without
    // TASHKEEL, (3) updates the column to the new type, (4) drops the old
    // type. That is intentionally not done here automatically because it
    // would silently lose any TASHKEEL mistakes already saved.
  }
}
