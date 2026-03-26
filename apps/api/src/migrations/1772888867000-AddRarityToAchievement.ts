import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRarityToAchievement1772888867000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "achievement_rarity_enum" AS ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY')`);
    await queryRunner.query(`ALTER TABLE "achievement" ADD "rarity" "achievement_rarity_enum" NOT NULL DEFAULT 'COMMON'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "achievement" DROP COLUMN "rarity"`);
    await queryRunner.query(`DROP TYPE "achievement_rarity_enum"`);
  }
}
