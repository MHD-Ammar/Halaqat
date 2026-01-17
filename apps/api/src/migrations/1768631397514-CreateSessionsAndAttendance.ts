import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionsAndAttendance1768631397514 implements MigrationInterface {
    name = 'CreateSessionsAndAttendance1768631397514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."session_status_enum" AS ENUM('OPEN', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "date" date NOT NULL, "notes" text, "status" "public"."session_status_enum" NOT NULL DEFAULT 'OPEN', "circle_id" uuid NOT NULL, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d7fb8edba31626376965c54c43" ON "session" ("date") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba6523542a1603a43a42a70dfe" ON "session" ("circle_id") `);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'PRESENT', "session_id" uuid NOT NULL, "student_id" uuid NOT NULL, CONSTRAINT "UQ_cb17b7626e1fd2e14ee9ba936b0" UNIQUE ("session_id", "student_id"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5940f7beb6d791a618dbf88361" ON "attendance" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6200532f3ef99f639a27bdcae7" ON "attendance" ("student_id") `);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_ba6523542a1603a43a42a70dfef" FOREIGN KEY ("circle_id") REFERENCES "circle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_5940f7beb6d791a618dbf88361e" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_5940f7beb6d791a618dbf88361e"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_ba6523542a1603a43a42a70dfef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6200532f3ef99f639a27bdcae7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5940f7beb6d791a618dbf88361"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba6523542a1603a43a42a70dfe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7fb8edba31626376965c54c43"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP TYPE "public"."session_status_enum"`);
    }

}
