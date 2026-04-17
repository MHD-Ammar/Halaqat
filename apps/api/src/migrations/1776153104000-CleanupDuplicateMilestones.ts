import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupDuplicateMilestones1776153104000 implements MigrationInterface {
    name = 'CleanupDuplicateMilestones1776153104000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The migration 1771971801758 accidentally seeded 3 milestones inline.
        // The seed.ts script also seeds milestones (with different data).
        // This caused duplicate records with overlapping target_levels.
        //
        // Migration-seeded (to be removed):
        //   (5, 'صندوق المبتدئين', '500'), (10, 'صندوق التميز', '1000'), (20, 'صندوق المحترفين', '2000')
        //
        // seed.ts-seeded (to keep):
        //   (2, 'صندوق المبتدئين', '100'), (5, 'صندوق المثابر', '300'), (10, 'الصندوق الفضي', '500')

        // Delete the migration-seeded milestones by their unique (title, reward_value) pairs.
        // First, clean up any student_milestones that reference them to avoid FK violations.
        await queryRunner.query(`
            DELETE FROM "student_milestones" 
            WHERE "milestoneId" IN (
                SELECT "id" FROM "milestone_rewards" 
                WHERE ("title" = 'صندوق المبتدئين' AND "reward_value" = '500')
                   OR ("title" = 'صندوق التميز' AND "reward_value" = '1000')
                   OR ("title" = 'صندوق المحترفين' AND "reward_value" = '2000')
            )
        `);

        await queryRunner.query(`
            DELETE FROM "milestone_rewards" 
            WHERE ("title" = 'صندوق المبتدئين' AND "reward_value" = '500')
               OR ("title" = 'صندوق التميز' AND "reward_value" = '1000')
               OR ("title" = 'صندوق المحترفين' AND "reward_value" = '2000')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-insert the milestones that were removed
        await queryRunner.query(`
            INSERT INTO "milestone_rewards" ("target_level", "title", "reward_type", "reward_value") 
            VALUES 
                (5, 'صندوق المبتدئين', 'BONUS_XP', '500'),
                (10, 'صندوق التميز', 'BONUS_XP', '1000'),
                (20, 'صندوق المحترفين', 'BONUS_XP', '2000')
        `);
    }
}
