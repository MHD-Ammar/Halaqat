import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMosqueToPointRule1770492066573 implements MigrationInterface {
    name = 'AddMosqueToPointRule1770492066573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8a6551868d08f942914519d40e"`);
        await queryRunner.query(`DELETE FROM "point_rule"`); // Clear data to avoid not-null constraint violation
        await queryRunner.query(`ALTER TABLE "point_rule" ADD "mosque_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."point_transaction_source_type_enum" RENAME TO "point_transaction_source_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."point_transaction_source_type_enum" AS ENUM('RECITATION', 'ATTENDANCE', 'EXAM', 'MANUAL_REWARD', 'MANUAL_PENALTY')`);
        await queryRunner.query(`ALTER TABLE "point_transaction" ALTER COLUMN "source_type" TYPE "public"."point_transaction_source_type_enum" USING "source_type"::"text"::"public"."point_transaction_source_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."point_transaction_source_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "point_rule" DROP CONSTRAINT "UQ_8a6551868d08f942914519d40e8"`);
        await queryRunner.query(`CREATE INDEX "IDX_b0f87103b7dedc06cd13bd236f" ON "point_rule" ("key", "mosque_id") `);
        await queryRunner.query(`ALTER TABLE "point_rule" ADD CONSTRAINT "UQ_b0f87103b7dedc06cd13bd236f7" UNIQUE ("key", "mosque_id")`);
        await queryRunner.query(`ALTER TABLE "point_rule" ADD CONSTRAINT "FK_35e1ae46b9222c3f6d7eb8ff89f" FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "point_rule" DROP CONSTRAINT "FK_35e1ae46b9222c3f6d7eb8ff89f"`);
        await queryRunner.query(`ALTER TABLE "point_rule" DROP CONSTRAINT "UQ_b0f87103b7dedc06cd13bd236f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0f87103b7dedc06cd13bd236f"`);
        await queryRunner.query(`ALTER TABLE "point_rule" ADD CONSTRAINT "UQ_8a6551868d08f942914519d40e8" UNIQUE ("key")`);
        await queryRunner.query(`CREATE TYPE "public"."point_transaction_source_type_enum_old" AS ENUM('RECITATION', 'ATTENDANCE', 'MANUAL_REWARD', 'MANUAL_PENALTY')`);
        await queryRunner.query(`ALTER TABLE "point_transaction" ALTER COLUMN "source_type" TYPE "public"."point_transaction_source_type_enum_old" USING "source_type"::"text"::"public"."point_transaction_source_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."point_transaction_source_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."point_transaction_source_type_enum_old" RENAME TO "point_transaction_source_type_enum"`);
        await queryRunner.query(`ALTER TABLE "point_rule" DROP COLUMN "mosque_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_8a6551868d08f942914519d40e" ON "point_rule" ("key") `);
    }

}
