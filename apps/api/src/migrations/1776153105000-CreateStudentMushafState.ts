import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateStudentMushafState1776153105000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'student_mushaf_state',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'student_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'last_page_number',
            type: 'int',
            default: 1,
          },
          {
            name: 'last_surah_number',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'last_ayah_number',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Index on student_id for fast lookups
    await queryRunner.createIndex(
      'student_mushaf_state',
      new TableIndex({
        name: 'IDX_student_mushaf_state_student_id',
        columnNames: ['student_id'],
      }),
    );

    // Index on deletedAt for soft-delete queries
    await queryRunner.createIndex(
      'student_mushaf_state',
      new TableIndex({
        name: 'IDX_student_mushaf_state_deleted',
        columnNames: ['deleted_at'],
      }),
    );

    // Foreign key to student table
    await queryRunner.createForeignKey(
      'student_mushaf_state',
      new TableForeignKey({
        name: 'FK_student_mushaf_state_student',
        columnNames: ['student_id'],
        referencedTableName: 'student',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('student_mushaf_state', 'FK_student_mushaf_state_student');
    await queryRunner.dropIndex('student_mushaf_state', 'IDX_student_mushaf_state_deleted');
    await queryRunner.dropIndex('student_mushaf_state', 'IDX_student_mushaf_state_student_id');
    await queryRunner.dropTable('student_mushaf_state');
  }
}
