import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarColumnsToStudent1773000000000 implements MigrationInterface {
  name = 'AddAvatarColumnsToStudent1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" ADD "active_title" varchar`);
    await queryRunner.query(`ALTER TABLE "student" ADD "active_avatar_frame" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "active_avatar_frame"`);
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "active_title"`);
  }
}