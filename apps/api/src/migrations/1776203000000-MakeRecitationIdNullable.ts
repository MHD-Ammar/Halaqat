import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeRecitationIdNullable1776203000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recitation_mistake"
        ALTER COLUMN "recitation_id" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recitation_mistake"
        ALTER COLUMN "recitation_id" SET NOT NULL
    `);
  }
}
