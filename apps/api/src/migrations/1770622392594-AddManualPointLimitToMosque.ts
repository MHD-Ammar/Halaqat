import { MigrationInterface, QueryRunner } from "typeorm";

export class AddManualPointLimitToMosque1770622392594 implements MigrationInterface {
    name = 'AddManualPointLimitToMosque1770622392594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mosque" ADD "manual_point_limit" integer NOT NULL DEFAULT '20'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mosque" DROP COLUMN "manual_point_limit"`);
    }

}
