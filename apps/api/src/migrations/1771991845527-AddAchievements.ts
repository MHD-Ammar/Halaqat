import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAchievements1771991845527 implements MigrationInterface {
    name = 'AddAchievements1771991845527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."achievement_criteria_type_enum" AS ENUM('TOTAL_QUESTS_CATEGORY', 'STREAK_DAYS', 'TOTAL_XP')`);
        await queryRunner.query(`CREATE TYPE "public"."achievement_criteria_category_enum" AS ENUM('PRAYER', 'QURAN', 'ADHKAR', 'BEHAVIOR', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "achievement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying(255) NOT NULL, "description" text NOT NULL, "badge_icon" character varying(255) NOT NULL, "criteria_type" "public"."achievement_criteria_type_enum" NOT NULL, "criteria_target" integer NOT NULL, "criteria_category" "public"."achievement_criteria_category_enum", CONSTRAINT "PK_441339f40e8ce717525a381671e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3eb73e616bc8f2c504bf39e3fa" ON "achievement" ("deleted_at") `);
        await queryRunner.query(`CREATE TABLE "student_achievement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "student_id" uuid NOT NULL, "achievement_id" uuid NOT NULL, "unlocked_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ddc065b3ac7c9a8c82841b1d2a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4dad026e9ef580042d5f90cf3e" ON "student_achievement" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe4c14007479298a63556a3223" ON "student_achievement" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf10a9f4a10c15f80450e9d01d" ON "student_achievement" ("achievement_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e2f92b2440abc633bd402fdbd6" ON "student_achievement" ("student_id", "achievement_id") `);
        await queryRunner.query(`ALTER TABLE "student_achievement" ADD CONSTRAINT "FK_fe4c14007479298a63556a32232" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_achievement" ADD CONSTRAINT "FK_bf10a9f4a10c15f80450e9d01d0" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_achievement" DROP CONSTRAINT "FK_bf10a9f4a10c15f80450e9d01d0"`);
        await queryRunner.query(`ALTER TABLE "student_achievement" DROP CONSTRAINT "FK_fe4c14007479298a63556a32232"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e2f92b2440abc633bd402fdbd6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf10a9f4a10c15f80450e9d01d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe4c14007479298a63556a3223"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4dad026e9ef580042d5f90cf3e"`);
        await queryRunner.query(`DROP TABLE "student_achievement"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3eb73e616bc8f2c504bf39e3fa"`);
        await queryRunner.query(`DROP TABLE "achievement"`);
        await queryRunner.query(`DROP TYPE "public"."achievement_criteria_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."achievement_criteria_type_enum"`);
    }

}
