import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExamsModule1768800000000 implements MigrationInterface {
  name = "CreateExamsModule1768800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."exam_status_enum" AS ENUM('PENDING', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exam_question_type_enum" AS ENUM('CURRENT_PART', 'CUMULATIVE')`,
    );

    // Create exam table
    await queryRunner.query(`
      CREATE TABLE "exam" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "student_id" uuid NOT NULL,
        "examiner_id" uuid,
        "date" date NOT NULL,
        "score" float,
        "status" "public"."exam_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes" text,
        CONSTRAINT "PK_exam" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for exam table
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_student_id" ON "exam" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_examiner_id" ON "exam" ("examiner_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_exam_date" ON "exam" ("date")`);

    // Create exam_question table
    await queryRunner.query(`
      CREATE TABLE "exam_question" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "exam_id" uuid NOT NULL,
        "type" "public"."exam_question_type_enum" NOT NULL,
        "question_text" text,
        "mistakes_count" integer NOT NULL DEFAULT 0,
        "max_score" integer NOT NULL,
        "achieved_score" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_exam_question" PRIMARY KEY ("id")
      )
    `);

    // Create index for exam_question table
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_question_exam_id" ON "exam_question" ("exam_id")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "exam"
      ADD CONSTRAINT "FK_exam_student_id"
      FOREIGN KEY ("student_id") REFERENCES "student"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "exam"
      ADD CONSTRAINT "FK_exam_examiner_id"
      FOREIGN KEY ("examiner_id") REFERENCES "user"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_question"
      ADD CONSTRAINT "FK_exam_question_exam_id"
      FOREIGN KEY ("exam_id") REFERENCES "exam"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "exam_question" DROP CONSTRAINT "FK_exam_question_exam_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam" DROP CONSTRAINT "FK_exam_examiner_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam" DROP CONSTRAINT "FK_exam_student_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_exam_question_exam_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_exam_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_exam_examiner_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_exam_student_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "exam_question"`);
    await queryRunner.query(`DROP TABLE "exam"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."exam_question_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."exam_status_enum"`);
  }
}
