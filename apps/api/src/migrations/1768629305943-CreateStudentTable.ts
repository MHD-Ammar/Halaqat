import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudentTable1768629305943 implements MigrationInterface {
    name = 'CreateStudentTable1768629305943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "student" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "phone" character varying, "dob" date, "address" character varying, "notes" text, "circle_id" uuid, CONSTRAINT "PK_3d8016e1cb58429474a3c041904" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f07a92b3d43e2f27aa300b92ed" ON "student" ("circle_id") `);
        await queryRunner.query(`ALTER TABLE "student" ADD CONSTRAINT "FK_f07a92b3d43e2f27aa300b92ed1" FOREIGN KEY ("circle_id") REFERENCES "circle"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student" DROP CONSTRAINT "FK_f07a92b3d43e2f27aa300b92ed1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f07a92b3d43e2f27aa300b92ed"`);
        await queryRunner.query(`DROP TABLE "student"`);
    }

}
