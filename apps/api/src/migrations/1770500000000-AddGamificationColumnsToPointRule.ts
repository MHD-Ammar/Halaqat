import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Add gamification columns to point_rule table
 * - isSystem: System rules cannot be deleted
 * - isVisibleToTeacher: Show in teacher's Quick Reward menu
 * - isCustomEntry: Teacher enters points manually
 * - maxCustomValue: Cap for custom entries
 */
export class AddGamificationColumnsToPointRule1770500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isSystem column
    await queryRunner.addColumn(
      "point_rule",
      new TableColumn({
        name: "is_system",
        type: "boolean",
        default: false,
      })
    );

    // Add isVisibleToTeacher column
    await queryRunner.addColumn(
      "point_rule",
      new TableColumn({
        name: "is_visible_to_teacher",
        type: "boolean",
        default: true,
      })
    );

    // Add isCustomEntry column
    await queryRunner.addColumn(
      "point_rule",
      new TableColumn({
        name: "is_custom_entry",
        type: "boolean",
        default: false,
      })
    );

    // Add maxCustomValue column
    await queryRunner.addColumn(
      "point_rule",
      new TableColumn({
        name: "max_custom_value",
        type: "int",
        isNullable: true,
      })
    );

    // Mark existing rules as system rules (not visible in Quick Reward)
    await queryRunner.query(`
      UPDATE point_rule 
      SET is_system = true, is_visible_to_teacher = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("point_rule", "max_custom_value");
    await queryRunner.dropColumn("point_rule", "is_custom_entry");
    await queryRunner.dropColumn("point_rule", "is_visible_to_teacher");
    await queryRunner.dropColumn("point_rule", "is_system");
  }
}
