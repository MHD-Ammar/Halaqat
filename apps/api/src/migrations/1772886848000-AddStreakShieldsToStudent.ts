import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStreakShieldsToStudent1772886848000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" ADD "streak_shields" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "student" ADD "last_shield_used_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "last_shield_used_at"`);
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "streak_shields"`);
  }
}
