import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreEntities1772916284739 implements MigrationInterface {
    name = 'AddStoreEntities1772916284739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."store_item_type_enum" AS ENUM('STREAK_SHIELD', 'AVATAR_FRAME', 'TITLE', 'DOUBLE_XP', 'REAL_WORLD')`);
        await queryRunner.query(`CREATE TABLE "store_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(255) NOT NULL, "name_ar" character varying(255) NOT NULL, "description" text, "description_ar" text, "type" "public"."store_item_type_enum" NOT NULL, "xp_cost" integer NOT NULL, "reward_value" character varying NOT NULL, "icon" character varying(50) NOT NULL DEFAULT '🎁', "is_active" boolean NOT NULL DEFAULT true, "max_per_student" integer, "stock" integer, "min_level" integer NOT NULL DEFAULT '1', "mosque_id" uuid NOT NULL, CONSTRAINT "PK_d8d520cf8af78e9dd5bc47943c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_353cb1c096b9cb2e09ff02751e" ON "store_item" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fc7373c36e3e6047796985909" ON "store_item" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_1de1929674ccad8f1887d89fe7" ON "store_item" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_c84e9836db75f80ee819cc1053" ON "store_item" ("mosque_id") `);
        await queryRunner.query(`CREATE TABLE "store_purchase" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "student_id" uuid NOT NULL, "item_id" uuid NOT NULL, "xp_spent" integer NOT NULL, "purchased_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e6313dd25a30c2a5b130c0a8d71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_85b49446a13b2320980df85924" ON "store_purchase" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a9678cf2e60c9467c59ee17fd" ON "store_purchase" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b46f29f449dbd1b04c9df1b5d3" ON "store_purchase" ("item_id") `);
        await queryRunner.query(`ALTER TABLE "store_purchase" ADD CONSTRAINT "FK_1a9678cf2e60c9467c59ee17fd6" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_purchase" ADD CONSTRAINT "FK_b46f29f449dbd1b04c9df1b5d3c" FOREIGN KEY ("item_id") REFERENCES "store_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_purchase" DROP CONSTRAINT "FK_b46f29f449dbd1b04c9df1b5d3c"`);
        await queryRunner.query(`ALTER TABLE "store_purchase" DROP CONSTRAINT "FK_1a9678cf2e60c9467c59ee17fd6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b46f29f449dbd1b04c9df1b5d3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a9678cf2e60c9467c59ee17fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85b49446a13b2320980df85924"`);
        await queryRunner.query(`DROP TABLE "store_purchase"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c84e9836db75f80ee819cc1053"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1de1929674ccad8f1887d89fe7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fc7373c36e3e6047796985909"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_353cb1c096b9cb2e09ff02751e"`);
        await queryRunner.query(`DROP TABLE "store_item"`);
        await queryRunner.query(`DROP TYPE "public"."store_item_type_enum"`);
    }

}
