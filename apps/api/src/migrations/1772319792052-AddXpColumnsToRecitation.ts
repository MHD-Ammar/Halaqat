import { MigrationInterface, QueryRunner } from "typeorm";

export class AddXpColumnsToRecitation1772319792052 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "recitation" ADD "xp_awarded" integer NOT NULL DEFAULT 0`,
        );
        await queryRunner.query(
            `ALTER TABLE "recitation" ADD "reward_seen" boolean NOT NULL DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recitation" DROP COLUMN "reward_seen"`);
        await queryRunner.query(`ALTER TABLE "recitation" DROP COLUMN "xp_awarded"`);
    }

}
