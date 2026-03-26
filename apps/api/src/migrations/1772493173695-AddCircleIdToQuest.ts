import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCircleIdToQuest1772493173695 implements MigrationInterface {
    name = 'AddCircleIdToQuest1772493173695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quest" ADD "circle_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_2e41ddd00bf13056daa5f0ce42" ON "quest" ("circle_id") `);
        await queryRunner.query(`ALTER TABLE "quest" ADD CONSTRAINT "FK_2e41ddd00bf13056daa5f0ce422" FOREIGN KEY ("circle_id") REFERENCES "circle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quest" DROP CONSTRAINT "FK_2e41ddd00bf13056daa5f0ce422"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e41ddd00bf13056daa5f0ce42"`);
        await queryRunner.query(`ALTER TABLE "quest" DROP COLUMN "circle_id"`);
    }

}
