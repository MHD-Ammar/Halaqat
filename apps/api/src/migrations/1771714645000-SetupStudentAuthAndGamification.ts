import { MigrationInterface, QueryRunner } from "typeorm";

export class SetupStudentAuthAndGamification1771714645000 implements MigrationInterface {
    name = 'SetupStudentAuthAndGamification1771714645000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── Auth columns ─────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "student" ADD "password_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "student" ADD "last_login_at" TIMESTAMP`);

        // ── Gamification columns ─────────────────────────────────
        await queryRunner.query(`ALTER TABLE "student" ADD "total_xp" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "student" ADD "current_level" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "student" ADD "current_streak" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "student" ADD "max_streak" integer NOT NULL DEFAULT 0`);

        // ── Drop legacy user_id FK and column ────────────────────
        // Drop ALL constraints on user_id (FK + unique from @OneToOne)
        const constraints = await queryRunner.query(`
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_name = 'student'
            AND constraint_name IN (
                SELECT constraint_name FROM information_schema.constraint_column_usage
                WHERE table_name = 'student' AND column_name = 'user_id'
            )
        `);
        for (const c of constraints) {
            await queryRunner.query(`ALTER TABLE "student" DROP CONSTRAINT IF EXISTS "${c.constraint_name}"`);
        }

        // Drop any remaining indexes on user_id
        const userIdIndexes = await queryRunner.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'student' AND indexdef LIKE '%user_id%'
        `);
        for (const idx of userIdIndexes) {
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."${idx.indexname}"`);
        }

        // Drop the column
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN IF EXISTS "user_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ── Re-add user_id column ────────────────────────────────
        await queryRunner.query(`ALTER TABLE "student" ADD "user_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_student_user_id" ON "student" ("user_id")`);
        await queryRunner.query(`ALTER TABLE "student" ADD CONSTRAINT "FK_student_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // ── Drop gamification columns ────────────────────────────
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "max_streak"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "current_streak"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "current_level"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "total_xp"`);

        // ── Drop auth columns ────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "password_hash"`);
    }
}
