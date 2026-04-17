import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampaignTable1775315421777 implements MigrationInterface {
    name = 'AddCampaignTable1775315421777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create campaign table
        await queryRunner.query(`CREATE TABLE "campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying(255) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "form_config" jsonb NOT NULL, CONSTRAINT "PK_0ce34d26e7f2eb316a3a592cdc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ffca4074cf14f4fe957118676c" ON "campaign" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f63c1a9b0b7023d4fe1dd92fd9" ON "campaign" ("start_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_39e66788f586c978e675d1790e" ON "campaign" ("end_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_d2880ad7ab83bbcc9d0c17dd02" ON "campaign" ("is_active") `);

        // 2. Add campaign_id column to daily_submission safely
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD COLUMN IF NOT EXISTS "campaign_id" uuid`);

        // 3. Create a DEFAULT campaign for existing data if any (mapping from campaign_key)
        // Check if our default already exists first to avoid duplicates
        const existingCampaign = await queryRunner.query(`SELECT id FROM "campaign" WHERE title = 'Ramadan 2024' LIMIT 1`);
        if (existingCampaign.length === 0) {
            await queryRunner.query(`
                INSERT INTO "campaign" (id, title, start_date, end_date, is_active, form_config)
                VALUES (uuid_generate_v4(), 'Ramadan 2024', '2024-03-10', '2024-04-10', true, '[]')
            `);
        }

        await queryRunner.query(`
            UPDATE "daily_submission" 
            SET "campaign_id" = (SELECT id FROM "campaign" WHERE title = 'Ramadan 2024' LIMIT 1)
            WHERE "campaign_id" IS NULL OR "campaign_id" NOT IN (SELECT id FROM "campaign")
        `);

        // 4. Set column to NOT NULL
        await queryRunner.query(`ALTER TABLE "daily_submission" ALTER COLUMN "campaign_id" SET NOT NULL`);

        // 5. Drop old constraints and columns safely
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UQ_5c1104b9230e8ca4ba7c6227520') THEN
                    ALTER TABLE "daily_submission" DROP CONSTRAINT "UQ_5c1104b9230e8ca4ba7c6227520";
                END IF;
            END $$;
        `);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_96a10cc35cfe89fdf844391590"`);
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP COLUMN IF EXISTS "campaign_key"`);

        // 6. Add new constraints
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_daily_submission_campaign_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_submission_campaign_id" ON "daily_submission" ("campaign_id") `);
        
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UQ_unique_daily_submission') THEN
                    ALTER TABLE "daily_submission" ADD CONSTRAINT "UQ_unique_daily_submission" UNIQUE ("student_id", "submission_date", "campaign_id");
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_b915bf2482cf3d5c32235a42162') THEN
                    ALTER TABLE "daily_submission" ADD CONSTRAINT "FK_b915bf2482cf3d5c32235a42162" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "FK_b915bf2482cf3d5c32235a42162"`);
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP CONSTRAINT "UQ_unique_daily_submission"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_daily_submission_campaign_id"`);
        
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD "campaign_key" character varying(50)`);
        await queryRunner.query(`UPDATE "daily_submission" SET "campaign_key" = 'ramadan' WHERE "campaign_key" IS NULL`);
        await queryRunner.query(`ALTER TABLE "daily_submission" ALTER COLUMN "campaign_key" SET NOT NULL`);
        
        await queryRunner.query(`CREATE INDEX "IDX_96a10cc35cfe89fdf844391590" ON "daily_submission" ("campaign_key") `);
        await queryRunner.query(`ALTER TABLE "daily_submission" ADD CONSTRAINT "UQ_5c1104b9230e8ca4ba7c6227520" UNIQUE ("student_id", "submission_date", "campaign_key")`);
        
        await queryRunner.query(`ALTER TABLE "daily_submission" DROP COLUMN "campaign_id"`);
        
        await queryRunner.query(`DROP INDEX "public"."IDX_d2880ad7ab83bbcc9d0c17dd02"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39e66788f586c978e675d1790e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f63c1a9b0b7023d4fe1dd92fd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ffca4074cf14f4fe957118676c"`);
        await queryRunner.query(`DROP TABLE "campaign"`);
    }
}
