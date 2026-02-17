import { MigrationInterface, QueryRunner } from "typeorm";

export class DailyChallengeRefactor1771309440737 implements MigrationInterface {
    name = 'DailyChallengeRefactor1771309440737'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "daily_submission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "submission_date" date NOT NULL, "campaign_key" character varying(50) NOT NULL, "submission_data" jsonb NOT NULL, "xp_earned" integer NOT NULL, "streak" integer NOT NULL DEFAULT '1', "student_id" uuid NOT NULL, "mosque_id" uuid NOT NULL, CONSTRAINT "UQ_5c1104b9230e8ca4ba7c6227520" UNIQUE ("student_id", "submission_date", "campaign_key"), CONSTRAINT "PK_5d9b86dc1a922f271b9ea1098a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_470e1c4a2e34a362a5c501f4cc" ON "daily_submission" ("submission_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_96a10cc35cfe89fdf844391590" ON "daily_submission" ("campaign_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_926deb29fbd53a0d264f5f855c" ON "daily_submission" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_027eadf281d774a810dba72b9e" ON "daily_submission" ("mosque_id") `);
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD CONSTRAINT "FK_926deb29fbd53a0d264f5f855ca" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD CONSTRAINT "FK_027eadf281d774a810dba72b9ea" FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "FK_027eadf281d774a810dba72b9ea"`);
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "FK_926deb29fbd53a0d264f5f855ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_027eadf281d774a810dba72b9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_926deb29fbd53a0d264f5f855c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96a10cc35cfe89fdf844391590"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_470e1c4a2e34a362a5c501f4cc"`);
        await queryRunner.query(`DROP TABLE "daily_submission"`);
    }

}
