import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExamSchema1769810117667 implements MigrationInterface {
    name = 'UpdateExamSchema1769810117667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "score"`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "juz_number" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "attempt_number" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "current_part_score" double precision`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "cumulative_score" double precision`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "final_score" double precision`);
        await queryRunner.query(`ALTER TABLE "exam_question" ADD "question_juz_number" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam_question" DROP COLUMN "question_juz_number"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "final_score"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "cumulative_score"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "current_part_score"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "attempt_number"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "juz_number"`);
        await queryRunner.query(`ALTER TABLE "exam" ADD "score" double precision`);
    }

}
