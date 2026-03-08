import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeeklyLeagueSystem1773200000000 implements MigrationInterface {
  name = "AddWeeklyLeagueSystem1773200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "league_tier" (
        "id" SERIAL NOT NULL,
        "rank" integer NOT NULL,
        "name" character varying NOT NULL,
        "name_ar" character varying NOT NULL,
        "icon" character varying(50) NOT NULL,
        "color" character varying NOT NULL,
        "promotion_slots" integer NOT NULL DEFAULT 10,
        "relegation_slots" integer NOT NULL DEFAULT 5,
        "xp_bonus" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_league_tier_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_league_tier_rank" UNIQUE ("rank")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "student_league" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "tier_id" integer NOT NULL,
        "week_start" date NOT NULL,
        "weekly_xp" integer NOT NULL DEFAULT 0,
        "final_rank" integer,
        "result" character varying,
        "result_seen_at" TIMESTAMP,
        "mosque_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_league_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_league_student_week" UNIQUE ("student_id", "week_start"),
        CONSTRAINT "CHK_student_league_result" CHECK (
          "result" IS NULL OR "result" IN ('promoted', 'relegated', 'stayed')
        )
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_student_league_student_id" ON "student_league" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_league_week_start" ON "student_league" ("week_start")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_league_mosque_id" ON "student_league" ("mosque_id")`);

    await queryRunner.query(`
      ALTER TABLE "student_league"
      ADD CONSTRAINT "FK_student_league_student"
      FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "student_league"
      ADD CONSTRAINT "FK_student_league_tier"
      FOREIGN KEY ("tier_id") REFERENCES "league_tier"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      INSERT INTO "league_tier" ("rank", "name", "name_ar", "icon", "color", "promotion_slots", "relegation_slots", "xp_bonus")
      VALUES
        (1, 'Bronze', 'البرونزي', '🥉', 'amber', 10, 0, 30),
        (2, 'Silver', 'الفضي', '🥈', 'slate', 10, 5, 50),
        (3, 'Gold', 'الذهبي', '🥇', 'yellow', 10, 5, 75),
        (4, 'Diamond', 'الماسي', '💎', 'cyan', 10, 5, 100),
        (5, 'Champions', 'الأبطال', '👑', 'violet', 0, 5, 150)
      ON CONFLICT ("rank") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "name_ar" = EXCLUDED."name_ar",
        "icon" = EXCLUDED."icon",
        "color" = EXCLUDED."color",
        "promotion_slots" = EXCLUDED."promotion_slots",
        "relegation_slots" = EXCLUDED."relegation_slots",
        "xp_bonus" = EXCLUDED."xp_bonus"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "FK_student_league_tier"`);
    await queryRunner.query(`ALTER TABLE "student_league" DROP CONSTRAINT "FK_student_league_student"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_league_mosque_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_league_week_start"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_league_student_id"`);
    await queryRunner.query(`DROP TABLE "student_league"`);
    await queryRunner.query(`DROP TABLE "league_tier"`);
  }
}
