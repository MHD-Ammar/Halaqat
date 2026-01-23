import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMosqueTable1768900000000 implements MigrationInterface {
  name = "CreateMosqueTable1768900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mosque table
    await queryRunner.query(`
      CREATE TABLE "mosque" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "name" character varying NOT NULL,
        "code" character varying(6) NOT NULL,
        CONSTRAINT "UQ_mosque_code" UNIQUE ("code"),
        CONSTRAINT "PK_mosque" PRIMARY KEY ("id")
      )
    `);

    // Create index on code
    await queryRunner.query(
      `CREATE INDEX "IDX_mosque_code" ON "mosque" ("code")`,
    );

    // Insert default mosque (Al-Huda Mosque with code 111111)
    await queryRunner.query(`
      INSERT INTO "mosque" ("name", "code")
      VALUES ('Al-Huda Mosque', '111111')
    `);

    // Add foreign key constraint from user to mosque
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_user_mosque_id"
      FOREIGN KEY ("mosque_id") REFERENCES "mosque"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_user_mosque_id"`,
    );

    // Drop index
    await queryRunner.query(`DROP INDEX "public"."IDX_mosque_code"`);

    // Drop mosque table
    await queryRunner.query(`DROP TABLE "mosque"`);
  }
}
