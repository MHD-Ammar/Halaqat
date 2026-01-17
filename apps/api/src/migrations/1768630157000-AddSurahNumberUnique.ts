import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSurahNumberUnique1768630157000 implements MigrationInterface {
    name = 'AddSurahNumberUnique1768630157000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surah" ADD CONSTRAINT "UQ_193985671b80b51677db96c2f53" UNIQUE ("number")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surah" DROP CONSTRAINT "UQ_193985671b80b51677db96c2f53"`);
    }

}
