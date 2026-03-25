import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestTargetFields1774470733940 implements MigrationInterface {
    name = 'AddQuestTargetFields1774470733940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "FK_student_league_tier"`);
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "FK_student_league_student"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_league_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_league_week_start"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_league_mosque_id"`);
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "CHK_student_league_result"`);
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "UQ_student_league_student_week"`);
        await queryRunner.query(`CREATE TABLE "push_subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "endpoint" text NOT NULL, "auth_key" text NOT NULL, "p256dh_key" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_93dcc30cff5a0af8ba103083395" UNIQUE ("student_id", "endpoint"), CONSTRAINT "PK_07fc861c0d2c38c1b830fb9cb5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1e6395cc037c9e4e33ecba5a13" ON "push_subscription" ("student_id") `);
        await queryRunner.query(`CREATE TABLE "seasonal_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "name_ar" character varying(255) NOT NULL, "description" text, "description_ar" text, "starts_at" TIMESTAMP NOT NULL, "ends_at" TIMESTAMP NOT NULL, "xp_multiplier" numeric(3,1) NOT NULL DEFAULT '1', "icon" character varying(50) NOT NULL DEFAULT '🎉', "theme_color" character varying NOT NULL DEFAULT 'amber', "banner_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "mosque_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d8087fa13865115bccb8c75b9ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8f63d035af95c975116b7bbcf7" ON "seasonal_event" ("mosque_id") `);
        await queryRunner.query(`CREATE TABLE "feed_reaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "feed_item_key" character varying(100) NOT NULL, "reaction" character varying(20) NOT NULL DEFAULT 'congrats', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_caa9cc1821dc4d76792ba68f1d7" UNIQUE ("student_id", "feed_item_key"), CONSTRAINT "PK_a144f84d740af8064bb6e4ccfda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f3418edb7ad9f4cb06f83688c0" ON "feed_reaction" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0220608306c376c6f39874b8a3" ON "feed_reaction" ("feed_item_key") `);
        await queryRunner.query(`CREATE TABLE "event_quest" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "quest_id" uuid NOT NULL, "bonus_xp" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_ebe60f0ab169dfef3427e993251" UNIQUE ("event_id", "quest_id"), CONSTRAINT "PK_616707b6a872bd9972b48766415" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b0417a60cced1018a1ec431d31" ON "event_quest" ("event_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f24faa02f899a366282a080a8" ON "event_quest" ("quest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebe60f0ab169dfef3427e99325" ON "event_quest" ("event_id", "quest_id") `);
        await queryRunner.query(`ALTER TABLE "quest_completion" ADD "current_progress" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "quest" ADD "target" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "quest" ADD "target_unit" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "store_purchase" ADD "fulfillment_status" character varying`);
        await queryRunner.query(`ALTER TABLE "store_purchase" ADD "fulfillment_notes" text`);
        await queryRunner.query(`ALTER TABLE "store_purchase" ADD "fulfilled_at" TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df5c7ca8d2aa312db0c0cd92a5"`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ALTER COLUMN "earned_xp" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ALTER COLUMN "completed_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ALTER COLUMN "completed_at" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "IDX_df5c7ca8d2aa312db0c0cd92a5" ON "quest_completion" ("student_id", "quest_id", "completed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f7930698f36626eb764291f64f" ON "quest_completion" ("student_id", "quest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3777132f5b0d5fe31bd19e5a5" ON "student_league" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7ffe66cf41d4891eed6ff1aa27" ON "student_league" ("week_start") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d74084cfcefd26cdb35839891" ON "student_league" ("mosque_id") `);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "UQ_7f81898fb37e2276d59f368a8cc" UNIQUE ("student_id", "week_start")`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD CONSTRAINT "FK_1e6395cc037c9e4e33ecba5a13d" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "FK_f3777132f5b0d5fe31bd19e5a56" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "FK_bfca5549fba0dcc97f77ca18a21" FOREIGN KEY ("tier_id") REFERENCES "league_tier"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_quest" ADD CONSTRAINT "FK_b0417a60cced1018a1ec431d313" FOREIGN KEY ("event_id") REFERENCES "seasonal_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_quest" ADD CONSTRAINT "FK_4f24faa02f899a366282a080a82" FOREIGN KEY ("quest_id") REFERENCES "quest"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_quest" DROP CONSTRAINT "FK_4f24faa02f899a366282a080a82"`);
        await queryRunner.query(`ALTER TABLE "event_quest" DROP CONSTRAINT "FK_b0417a60cced1018a1ec431d313"`);
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "FK_bfca5549fba0dcc97f77ca18a21"`);
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "FK_f3777132f5b0d5fe31bd19e5a56"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP CONSTRAINT "FK_1e6395cc037c9e4e33ecba5a13d"`);
        await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "UQ_7f81898fb37e2276d59f368a8cc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d74084cfcefd26cdb35839891"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ffe66cf41d4891eed6ff1aa27"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3777132f5b0d5fe31bd19e5a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7930698f36626eb764291f64f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df5c7ca8d2aa312db0c0cd92a5"`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ALTER COLUMN "completed_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ALTER COLUMN "completed_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "quest_completion" ALTER COLUMN "earned_xp" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "IDX_df5c7ca8d2aa312db0c0cd92a5" ON "quest_completion" ("student_id", "quest_id", "completed_at") `);
        await queryRunner.query(`ALTER TABLE "store_purchase" DROP COLUMN "fulfilled_at"`);
        await queryRunner.query(`ALTER TABLE "store_purchase" DROP COLUMN "fulfillment_notes"`);
        await queryRunner.query(`ALTER TABLE "store_purchase" DROP COLUMN "fulfillment_status"`);
        await queryRunner.query(`ALTER TABLE "quest" DROP COLUMN "target_unit"`);
        await queryRunner.query(`ALTER TABLE "quest" DROP COLUMN "target"`);
        await queryRunner.query(`ALTER TABLE "quest_completion" DROP COLUMN "current_progress"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebe60f0ab169dfef3427e99325"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f24faa02f899a366282a080a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0417a60cced1018a1ec431d31"`);
        await queryRunner.query(`DROP TABLE "event_quest"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0220608306c376c6f39874b8a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3418edb7ad9f4cb06f83688c0"`);
        await queryRunner.query(`DROP TABLE "feed_reaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f63d035af95c975116b7bbcf7"`);
        await queryRunner.query(`DROP TABLE "seasonal_event"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e6395cc037c9e4e33ecba5a13"`);
        await queryRunner.query(`DROP TABLE "push_subscription"`);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "UQ_student_league_student_week" UNIQUE ("student_id", "week_start")`);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "CHK_student_league_result" CHECK (((result IS NULL) OR ((result)::text = ANY ((ARRAY['promoted'::character varying, 'relegated'::character varying, 'stayed'::character varying])::text[]))))`);
        await queryRunner.query(`CREATE INDEX "IDX_student_league_mosque_id" ON "student_league" ("mosque_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_student_league_week_start" ON "student_league" ("week_start") `);
        await queryRunner.query(`CREATE INDEX "IDX_student_league_student_id" ON "student_league" ("student_id") `);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "FK_student_league_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_league" ADD CONSTRAINT "FK_student_league_tier" FOREIGN KEY ("tier_id") REFERENCES "league_tier"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
