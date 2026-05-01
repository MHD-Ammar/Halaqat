import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateRecitationMistake1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure the MistakeType enum exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "mistake_type_enum" AS ENUM ('MEMORIZATION', 'TAJWEED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: "recitation_mistake",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "recitation_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "student_id",
            type: "uuid",
          },
          {
            name: "word_location",
            type: "varchar",
            length: "20",
          },
          {
            name: "page_number",
            type: "int",
          },
          {
            name: "surah_number",
            type: "int",
          },
          {
            name: "ayah_number",
            type: "int",
          },
          {
            name: "word_position",
            type: "int",
          },
          {
            name: "mistake_type",
            type: "mistake_type_enum",
          },
          {
            name: "notes",
            type: "text",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "deleted_at",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Composite index for fast page-level lookups (Student Viewer)
    await queryRunner.createIndex(
      "recitation_mistake",
      new TableIndex({
        name: "IDX_recitation_mistake_student_page",
        columnNames: ["student_id", "page_number"],
      })
    );

    // Composite index for word-level dedup
    await queryRunner.createIndex(
      "recitation_mistake",
      new TableIndex({
        name: "IDX_recitation_mistake_student_word",
        columnNames: ["student_id", "word_location"],
      })
    );

    // Single-column indexes
    await queryRunner.createIndex(
      "recitation_mistake",
      new TableIndex({
        name: "IDX_recitation_mistake_recitation_id",
        columnNames: ["recitation_id"],
      })
    );

    await queryRunner.createIndex(
      "recitation_mistake",
      new TableIndex({
        name: "IDX_recitation_mistake_student_id",
        columnNames: ["student_id"],
      })
    );

    await queryRunner.createIndex(
      "recitation_mistake",
      new TableIndex({
        name: "IDX_recitation_mistake_deleted",
        columnNames: ["deleted_at"],
      })
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      "recitation_mistake",
      new TableForeignKey({
        name: "FK_recitation_mistake_recitation",
        columnNames: ["recitation_id"],
        referencedTableName: "recitation",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "recitation_mistake",
      new TableForeignKey({
        name: "FK_recitation_mistake_student",
        columnNames: ["student_id"],
        referencedTableName: "student",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("recitation_mistake", "FK_recitation_mistake_student");
    await queryRunner.dropForeignKey("recitation_mistake", "FK_recitation_mistake_recitation");
    await queryRunner.dropTable("recitation_mistake");
    await queryRunner.query('DROP TYPE IF EXISTS "mistake_type_enum"');
  }
}
