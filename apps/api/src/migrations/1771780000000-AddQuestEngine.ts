import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestEngine1771780000000 implements MigrationInterface {
  name = "AddQuestEngine1771780000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quest_category enum
    await queryRunner.query(`
      CREATE TYPE "public"."quest_category_enum" AS ENUM(
        'PRAYER', 'QURAN', 'ADHKAR', 'BEHAVIOR', 'GENERAL'
      )
    `);
    // Create quest_frequency enum
    await queryRunner.query(`
      CREATE TYPE "public"."quest_frequency_enum" AS ENUM(
        'DAILY', 'WEEKLY', 'ONETIME'
      )
    `);

    // Create quest table
    await queryRunner.query(`
      CREATE TABLE "quest" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "title" character varying(255) NOT NULL,
        "description" text,
        "category" "public"."quest_category_enum" NOT NULL,
        "frequency" "public"."quest_frequency_enum" NOT NULL,
        "xp_reward" integer NOT NULL,
        "icon" character varying(50) NOT NULL DEFAULT '⭐',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_quest_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_quest_category" ON "quest" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quest_frequency" ON "quest" ("frequency")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quest_is_active" ON "quest" ("is_active")`,
    );

    // Create quest_completion table
    await queryRunner.query(`
      CREATE TABLE "quest_completion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "quest_id" uuid NOT NULL,
        "earned_xp" integer NOT NULL,
        "completed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quest_completion_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_quest_completion_student_id" ON "quest_completion" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quest_completion_quest_id" ON "quest_completion" ("quest_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quest_completion_student_quest_date" ON "quest_completion" ("student_id", "quest_id", "completed_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "quest_completion"
      ADD CONSTRAINT "FK_quest_completion_student"
      FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "quest_completion"
      ADD CONSTRAINT "FK_quest_completion_quest"
      FOREIGN KEY ("quest_id") REFERENCES "quest"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quest_completion" DROP CONSTRAINT "FK_quest_completion_quest"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quest_completion" DROP CONSTRAINT "FK_quest_completion_student"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_quest_completion_student_quest_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_quest_completion_quest_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_quest_completion_student_id"`,
    );
    await queryRunner.query(`DROP TABLE "quest_completion"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_quest_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quest_frequency"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quest_category"`);
    await queryRunner.query(`DROP TABLE "quest"`);

    await queryRunner.query(`DROP TYPE "public"."quest_frequency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."quest_category_enum"`);
  }
}
