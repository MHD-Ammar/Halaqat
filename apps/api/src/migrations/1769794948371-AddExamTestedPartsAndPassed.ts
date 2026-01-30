import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExamTestedPartsAndPassed1769794948371 implements MigrationInterface {
    name = 'AddExamTestedPartsAndPassed1769794948371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "recitation"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "points"`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "tested_parts" integer array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "passed" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "passed"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "tested_parts"`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD "points" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD "recitation" text`);
    }

}
