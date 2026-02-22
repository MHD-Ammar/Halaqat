import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampaignEngine1771775289771 implements MigrationInterface {
    name = 'AddCampaignEngine1771775289771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create campaign table
        await queryRunner.query(`CREATE TABLE "campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying(255) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "form_config" jsonb NOT NULL, CONSTRAINT "PK_0ce34d26e7f2eb316a3a592cdc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f63c1a9b0b7023d4fe1dd92fd9" ON "campaign" ("start_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_39e66788f586c978e675d1790e" ON "campaign" ("end_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_d2880ad7ab83bbcc9d0c17dd02" ON "campaign" ("is_active") `);

        // 2. Add campaign_id column as nullable first
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD "campaign_id" uuid`);

        // 3. Manual Step: Insert default Campaign record
        await queryRunner.query(`
            INSERT INTO "campaign" (id, title, "start_date", "end_date", "is_active", "form_config") 
            VALUES (
                uuid_generate_v4(), 
                'تحدي رمضان 1445', 
                '2025-01-01', 
                '2026-12-31', 
                true, 
                '{"questions": {"fasting": {"type": "BOOLEAN", "xpNo": 0, "title": "هل صمت اليوم؟", "xpYes": 10}, "prayers": {"max": 5, "type": "NUMBER", "title": "كم صلاة فريضة صليت؟", "multiplier": 5}, "taraweeh": {"type": "BOOLEAN", "xpNo": 0, "title": "هل صليت التراويح؟", "xpYes": 15}}, "submitted_xp": 5}'
            );
        `);

        // 4. Manual Step: Update existing submissions
        await queryRunner.query(`
            UPDATE "daily_submission" 
            SET "campaign_id" = (SELECT id FROM "campaign" LIMIT 1) 
            WHERE "campaign_key" = 'ramadan';
        `);

        // 5. Drop old constraints and columns
        await queryRunner.query(`DROP INDEX "public"."IDX_96a10cc35cfe89fdf844391590"`);
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "UQ_5c1104b9230e8ca4ba7c6227520"`);
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP COLUMN "campaign_key"`);

        // 6. Make campaign_id NOT NULL and add constraints
        await queryRunner.query(`ALTER TABLE "daily_submission" ALTER COLUMN "campaign_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_b915bf2482cf3d5c32235a4216" ON "daily_submission" ("campaign_id") `);
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD CONSTRAINT "UQ_83d8f6400c9158bd596f7420ebd" UNIQUE ("student_id", "submission_date", "campaign_id")`);
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD CONSTRAINT "FK_b915bf2482cf3d5c32235a42162" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop constraints and indexes
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "FK_b915bf2482cf3d5c32235a42162"`);
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "UQ_83d8f6400c9158bd596f7420ebd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b915bf2482cf3d5c32235a4216"`);

        // 2. Add old campaign_key column as nullable
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD "campaign_key" character varying(50)`);

        // 3. Manual Step: Revert data mapping
        await queryRunner.query(`
            UPDATE "daily_submission" 
            SET "campaign_key" = 'ramadan' 
            WHERE "campaign_id" IS NOT NULL;
        `);

        // 4. Drop new column and campaign table
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP COLUMN "campaign_id"`);
        await queryRunner.query(`DROP TABLE "campaign"`);

        // 5. Make campaign_key NOT NULL and add old constraints
        await queryRunner.query(`ALTER TABLE "daily_submission" ALTER COLUMN "campaign_key" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD CONSTRAINT "UQ_5c1104b9230e8ca4ba7c6227520" UNIQUE ("submission_date", "campaign_key", "student_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_96a10cc35cfe89fdf844391590" ON "daily_submission" ("campaign_key") `);
    }

}
