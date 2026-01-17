import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePointsAndProgress1768632780648 implements MigrationInterface {
    name = 'CreatePointsAndProgress1768632780648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recitation_type_enum" AS ENUM('NEW_LESSON', 'REVIEW')`);
        await queryRunner.query(`CREATE TYPE "public"."recitation_quality_enum" AS ENUM('EXCELLENT', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'POOR')`);
        await queryRunner.query(`CREATE TABLE "recitation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."recitation_type_enum" NOT NULL, "quality" "public"."recitation_quality_enum" NOT NULL, "start_verse" integer NOT NULL, "end_verse" integer NOT NULL, "mistakes_count" integer NOT NULL DEFAULT '0', "notes" text, "student_id" uuid NOT NULL, "session_id" uuid NOT NULL, "surah_id" integer NOT NULL, CONSTRAINT "PK_2fbd7b203a9927d06ad6c21fe4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f1645a1efed203a7d07aa1216b" ON "recitation" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4388d8eebb3c7ed94f85b64d74" ON "recitation" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba4bd93b098d419642102da4a2" ON "recitation" ("surah_id") `);
        await queryRunner.query(`CREATE TYPE "public"."point_transaction_source_type_enum" AS ENUM('RECITATION', 'ATTENDANCE', 'MANUAL_REWARD', 'MANUAL_PENALTY')`);
        await queryRunner.query(`CREATE TABLE "point_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "amount" integer NOT NULL, "reason" character varying NOT NULL, "source_type" "public"."point_transaction_source_type_enum" NOT NULL, "student_id" uuid NOT NULL, "session_id" uuid, "awarded_by_id" uuid, CONSTRAINT "PK_b56b792bcf7f60a32758005caf7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc8062092c9f3669917500c96c" ON "point_transaction" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c090a190eb8253450a5b66986c" ON "point_transaction" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0f90f1871fe96019e4df79f467" ON "point_transaction" ("awarded_by_id") `);
        await queryRunner.query(`CREATE TABLE "point_rule" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "description" character varying NOT NULL, "points" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8a6551868d08f942914519d40e8" UNIQUE ("key"), CONSTRAINT "PK_cf38a25767f842df183d33d96f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8a6551868d08f942914519d40e" ON "point_rule" ("key") `);
        await queryRunner.query(`ALTER TABLE "student" ADD "total_points" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "recitation" ADD CONSTRAINT "FK_f1645a1efed203a7d07aa1216b7" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recitation" ADD CONSTRAINT "FK_4388d8eebb3c7ed94f85b64d74b" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recitation" ADD CONSTRAINT "FK_ba4bd93b098d419642102da4a2a" FOREIGN KEY ("surah_id") REFERENCES "surah"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "point_transaction" ADD CONSTRAINT "FK_dc8062092c9f3669917500c96c1" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "point_transaction" ADD CONSTRAINT "FK_c090a190eb8253450a5b66986c9" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "point_transaction" DROP CONSTRAINT "FK_c090a190eb8253450a5b66986c9"`);
        await queryRunner.query(`ALTER TABLE "point_transaction" DROP CONSTRAINT "FK_dc8062092c9f3669917500c96c1"`);
        await queryRunner.query(`ALTER TABLE "recitation" DROP CONSTRAINT "FK_ba4bd93b098d419642102da4a2a"`);
        await queryRunner.query(`ALTER TABLE "recitation" DROP CONSTRAINT "FK_4388d8eebb3c7ed94f85b64d74b"`);
        await queryRunner.query(`ALTER TABLE "recitation" DROP CONSTRAINT "FK_f1645a1efed203a7d07aa1216b7"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "total_points"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a6551868d08f942914519d40e"`);
        await queryRunner.query(`DROP TABLE "point_rule"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f90f1871fe96019e4df79f467"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c090a190eb8253450a5b66986c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc8062092c9f3669917500c96c"`);
        await queryRunner.query(`DROP TABLE "point_transaction"`);
        await queryRunner.query(`DROP TYPE "public"."point_transaction_source_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba4bd93b098d419642102da4a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4388d8eebb3c7ed94f85b64d74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1645a1efed203a7d07aa1216b"`);
        await queryRunner.query(`DROP TABLE "recitation"`);
        await queryRunner.query(`DROP TYPE "public"."recitation_quality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recitation_type_enum"`);
    }

}
