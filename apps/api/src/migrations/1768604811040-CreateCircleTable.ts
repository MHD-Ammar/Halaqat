import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCircleTable1768604811040 implements MigrationInterface {
    name = 'CreateCircleTable1768604811040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."circle_gender_enum" AS ENUM('MALE', 'FEMALE')`);
        await queryRunner.query(`CREATE TABLE "circle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "description" text, "location" character varying, "gender" "public"."circle_gender_enum" NOT NULL DEFAULT 'MALE', "teacher_id" uuid, CONSTRAINT "PK_9acc76020bf08433e769e72deb0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_18f21ba41c7762c679ba798d59" ON "circle" ("teacher_id") `);
        await queryRunner.query(`ALTER TABLE "circle" ADD CONSTRAINT "FK_18f21ba41c7762c679ba798d591" FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "circle" DROP CONSTRAINT "FK_18f21ba41c7762c679ba798d591"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_18f21ba41c7762c679ba798d59"`);
        await queryRunner.query(`DROP TABLE "circle"`);
        await queryRunner.query(`DROP TYPE "public"."circle_gender_enum"`);
    }

}
