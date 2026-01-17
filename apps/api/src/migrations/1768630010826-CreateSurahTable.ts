import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSurahTable1768630010826 implements MigrationInterface {
    name = 'CreateSurahTable1768630010826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."surah_type_enum" AS ENUM('QURAN', 'HADITH', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "surah" ("id" SERIAL NOT NULL, "number" integer NOT NULL, "name_arabic" character varying NOT NULL, "name_english" character varying NOT NULL, "verse_count" integer NOT NULL, "type" "public"."surah_type_enum" NOT NULL DEFAULT 'QURAN', CONSTRAINT "PK_a94c4dd903afb7159574c548b74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_193985671b80b51677db96c2f5" ON "surah" ("number") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_193985671b80b51677db96c2f5"`);
        await queryRunner.query(`DROP TABLE "surah"`);
        await queryRunner.query(`DROP TYPE "public"."surah_type_enum"`);
    }

}
