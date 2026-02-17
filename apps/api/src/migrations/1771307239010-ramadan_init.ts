import { MigrationInterface, QueryRunner } from "typeorm";

export class RamadanInit1771307239010 implements MigrationInterface {
    name = 'RamadanInit1771307239010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ramadan_submission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "submission_date" date NOT NULL, "submission_data" jsonb NOT NULL, "xp_earned" integer NOT NULL, "streak" integer NOT NULL DEFAULT '1', "student_id" uuid NOT NULL, "mosque_id" uuid NOT NULL, CONSTRAINT "UQ_a89feff7f3895bcd5c2308b4544" UNIQUE ("student_id", "submission_date"), CONSTRAINT "PK_86d840d458b37e861e561ee01bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_247b014c6d59d19251eca0366f" ON "ramadan_submission" ("submission_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_38371b0e1e5fc836421afc4d8c" ON "ramadan_submission" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b47ffecce694b15d9e9d527f94" ON "ramadan_submission" ("mosque_id") `);
        await queryRunner.query(`ALTER TABLE "ramadan_submission" ADD CONSTRAINT "FK_38371b0e1e5fc836421afc4d8c7" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ramadan_submission" ADD CONSTRAINT "FK_b47ffecce694b15d9e9d527f943" FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ramadan_submission" DROP CONSTRAINT "FK_b47ffecce694b15d9e9d527f943"`);
        await queryRunner.query(`ALTER TABLE "ramadan_submission" DROP CONSTRAINT "FK_38371b0e1e5fc836421afc4d8c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b47ffecce694b15d9e9d527f94"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_38371b0e1e5fc836421afc4d8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_247b014c6d59d19251eca0366f"`);
        await queryRunner.query(`DROP TABLE "ramadan_submission"`);
    }

}
