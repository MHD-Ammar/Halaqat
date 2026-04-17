import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMilestoneRewards1771971801758 implements MigrationInterface {
    name = 'AddMilestoneRewards1771971801758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quest_completion" DROP CONSTRAINT "FK_quest_completion_quest"`);
        await queryRunner.query(`ALTER TABLE "quest_completion" DROP CONSTRAINT "FK_quest_completion_student"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quest_completion_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quest_completion_quest_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quest_completion_student_quest_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quest_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quest_frequency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quest_is_active"`);
        await queryRunner.query(`CREATE TYPE "public"."milestone_rewards_reward_type_enum" AS ENUM('BONUS_XP', 'AVATAR_FRAME', 'TITLE')`);
        await queryRunner.query(`CREATE TABLE "milestone_rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "target_level" integer NOT NULL, "title" character varying NOT NULL, "reward_type" "public"."milestone_rewards_reward_type_enum" NOT NULL DEFAULT 'BONUS_XP', "reward_value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_48cfcbe30d37a11c97f3ff0f2ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "student_milestones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "milestone_id" uuid NOT NULL, "is_claimed" boolean NOT NULL DEFAULT false, "unlocked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "studentId" uuid, "milestoneId" uuid, CONSTRAINT "PK_0e2d76af9362cae68b169ef476c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_53894c504d49a37bb53cf25b33" ON "circle" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c5f711c0b5fbe7bbf3a588d5c8" ON "student" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ff69f640ccf60b5cee316eedd" ON "exam" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0770c33c675c8ff453a38b828" ON "session" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_da76252e6f74f7cc6694d9aa44" ON "mosque" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_22b81d3ed19a0bffcb660800f4" ON "user" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4e08d19faf016476be466bc92b" ON "attendance" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_b22d3c3c03456e1e18e8a15d39" ON "quest_completion" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d07b954994a14a411d4e53693d" ON "quest_completion" ("quest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df5c7ca8d2aa312db0c0cd92a5" ON "quest_completion" ("student_id", "quest_id", "completed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f7a7aec5def40c4b3f52064480" ON "quest" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_63f228aca13a2ccd141e655143" ON "quest" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_906a743ae5c9780f9dcf835e49" ON "quest" ("frequency") `);
        await queryRunner.query(`CREATE INDEX "IDX_afb195c967206ee3b28a99949a" ON "quest" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_93de2049e58dac6ed3c2bc94b8" ON "recitation" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_710bee300ac7dca01b5ee91e78" ON "point_transaction" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4b22cba34a06751dc6e7da974c" ON "exam_question" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_752a2c3b559f8722f742c2345a" ON "daily_submission" ("deleted_at") `);
        await queryRunner.query(`ALTER TABLE "quest_completion" ADD CONSTRAINT "FK_b22d3c3c03456e1e18e8a15d39e" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ADD CONSTRAINT "FK_d07b954994a14a411d4e53693d2" FOREIGN KEY ("quest_id") REFERENCES "quest"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_milestones" ADD CONSTRAINT "FK_366145e027eca56e0ea7a100d71" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_milestones" ADD CONSTRAINT "FK_ca794865c142a40c758f296050e" FOREIGN KEY ("milestoneId") REFERENCES "milestone_rewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        // Seed standard milestones
        await queryRunner.query(`
            INSERT INTO "milestone_rewards" ("target_level", "title", "reward_type", "reward_value") 
            VALUES 
                (5, 'صندوق المبتدئين', 'BONUS_XP', '500'),
                (10, 'صندوق التميز', 'BONUS_XP', '1000'),
                (20, 'صندوق المحترفين', 'BONUS_XP', '2000')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_milestones" DROP CONSTRAINT "FK_ca794865c142a40c758f296050e"`);
        await queryRunner.query(`ALTER TABLE "student_milestones" DROP CONSTRAINT "FK_366145e027eca56e0ea7a100d71"`);
        await queryRunner.query(`ALTER TABLE "quest_completion" DROP CONSTRAINT "FK_d07b954994a14a411d4e53693d2"`);
        await queryRunner.query(`ALTER TABLE "quest_completion" DROP CONSTRAINT "FK_b22d3c3c03456e1e18e8a15d39e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_752a2c3b559f8722f742c2345a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4b22cba34a06751dc6e7da974c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_710bee300ac7dca01b5ee91e78"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93de2049e58dac6ed3c2bc94b8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afb195c967206ee3b28a99949a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_906a743ae5c9780f9dcf835e49"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63f228aca13a2ccd141e655143"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7a7aec5def40c4b3f52064480"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df5c7ca8d2aa312db0c0cd92a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d07b954994a14a411d4e53693d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b22d3c3c03456e1e18e8a15d39"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e08d19faf016476be466bc92b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22b81d3ed19a0bffcb660800f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da76252e6f74f7cc6694d9aa44"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0770c33c675c8ff453a38b828"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ff69f640ccf60b5cee316eedd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5f711c0b5fbe7bbf3a588d5c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53894c504d49a37bb53cf25b33"`);
        await queryRunner.query(`DROP TABLE "student_milestones"`);
        await queryRunner.query(`DROP TABLE "milestone_rewards"`);
        await queryRunner.query(`DROP TYPE "public"."milestone_rewards_reward_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_quest_is_active" ON "quest" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_quest_frequency" ON "quest" ("frequency") `);
        await queryRunner.query(`CREATE INDEX "IDX_quest_category" ON "quest" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_quest_completion_student_quest_date" ON "quest_completion" ("student_id", "quest_id", "completed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_quest_completion_quest_id" ON "quest_completion" ("quest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_quest_completion_student_id" ON "quest_completion" ("student_id") `);
        await queryRunner.query(`ALTER TABLE "quest_completion" ADD CONSTRAINT "FK_quest_completion_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ADD CONSTRAINT "FK_quest_completion_quest" FOREIGN KEY ("quest_id") REFERENCES "quest"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
