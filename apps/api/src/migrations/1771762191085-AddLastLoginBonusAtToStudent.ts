import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLoginBonusAtToStudent1771762191085 implements MigrationInterface {
    name = 'AddLastLoginBonusAtToStudent1771762191085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student" ADD "last_login_bonus_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "last_login_bonus_at"`);
    }

}
