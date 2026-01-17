import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration to add guardian fields to student table
 * - guardian_name: varchar, nullable
 * - guardian_phone: varchar, nullable
 */
export class AddGuardianFields1737135000000 implements MigrationInterface {
    name = 'AddGuardianFields1737135000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student" ADD "guardian_name" character varying`);
        await queryRunner.query(`ALTER TABLE "student" ADD "guardian_phone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "guardian_phone"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "guardian_name"`);
    }
}
