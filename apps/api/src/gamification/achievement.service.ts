import { QuestCategory } from "@halaqat/types";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";

import { Achievement, AchievementCriteriaType } from "./entities/achievement.entity";
import { StudentAchievement } from "./entities/student-achievement.entity";
import { QuestCompletion } from "../quests/entities/quest-completion.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepo: Repository<Achievement>,
    @InjectRepository(StudentAchievement)
    private studentAchievementRepo: Repository<StudentAchievement>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(QuestCompletion)
    private questCompletionRepo: Repository<QuestCompletion>,
  ) {}

  async evaluateAchievements(studentId: string, manager?: EntityManager): Promise<Achievement[]> {
    const achRepo = manager ? manager.getRepository(Achievement) : this.achievementRepo;
    const studentAchRepo = manager ? manager.getRepository(StudentAchievement) : this.studentAchievementRepo;
    const studRepo = manager ? manager.getRepository(Student) : this.studentRepo;
    const questCompRepo = manager ? manager.getRepository(QuestCompletion) : this.questCompletionRepo;

    const allAchievements = await achRepo.find();
    if (!allAchievements.length) return [];

    const existingStudentAchievements = await studentAchRepo.find({ where: { studentId } });
    const unlockedIds = new Set(existingStudentAchievements.map(sa => sa.achievementId));

    const lockedAchievements = allAchievements.filter(a => !unlockedIds.has(a.id));
    if (!lockedAchievements.length) return [];

    const student = await studRepo.findOne({ where: { id: studentId } });
    if (!student) return [];

    const totalQuestsCountCache: Record<string, number> = {};
    const getQuestCount = async (category: QuestCategory | null) => {
      if (!category) return 0;
      if (totalQuestsCountCache[category] !== undefined) return totalQuestsCountCache[category];
      
      const count = await questCompRepo
        .createQueryBuilder("qc")
        .innerJoin("quest", "q", "qc.quest_id = q.id")
        .where("qc.student_id = :studentId", { studentId })
        .andWhere("q.category = :category", { category })
        .getCount();

      totalQuestsCountCache[category] = count;
      return count;
    };

    const newUnlockedAchievements: Achievement[] = [];

    for (const achievement of lockedAchievements) {
      let conditionMet = false;

      switch (achievement.criteriaType) {
        case AchievementCriteriaType.STREAK_DAYS:
          conditionMet = student.maxStreak >= achievement.criteriaTarget;
          break;
        case AchievementCriteriaType.TOTAL_XP:
          conditionMet = student.totalXp >= achievement.criteriaTarget;
          break;
        case AchievementCriteriaType.TOTAL_QUESTS_CATEGORY:
          if (achievement.criteriaCategory) {
            const count = await getQuestCount(achievement.criteriaCategory);
            conditionMet = count >= achievement.criteriaTarget;
          }
          break;
      }

      if (conditionMet) {
        newUnlockedAchievements.push(achievement);
      }
    }

    if (newUnlockedAchievements.length > 0) {
      const newRecords = newUnlockedAchievements.map(a => 
        studentAchRepo.create({
          studentId,
          achievementId: a.id,
          unlockedAt: new Date()
        })
      );
      await studentAchRepo.save(newRecords);
    }

    return newUnlockedAchievements;
  }

  private async getProgressForAchievement(
    achievement: Achievement,
    studentId: string,
    student: Student | null,
    totalQuestsCountCache: Record<string, number>
  ): Promise<number> {
    switch (achievement.criteriaType) {
      case AchievementCriteriaType.TOTAL_XP:
        return student?.totalXp ?? 0;
      case AchievementCriteriaType.STREAK_DAYS:
        return student?.maxStreak ?? 0;
      case AchievementCriteriaType.TOTAL_QUESTS_CATEGORY: {
        if (!achievement.criteriaCategory) return 0;
        if (totalQuestsCountCache[achievement.criteriaCategory] !== undefined) {
          return totalQuestsCountCache[achievement.criteriaCategory] ?? 0;
        }
        const count = await this.questCompletionRepo
          .createQueryBuilder("qc")
          .innerJoin("quest", "q", "qc.quest_id = q.id")
          .where("qc.student_id = :studentId", { studentId })
          .andWhere("q.category = :category", { category: achievement.criteriaCategory })
          .getCount();
        totalQuestsCountCache[achievement.criteriaCategory] = count;
        return count;
      }
    }
    return 0;
  }

  async getStudentAchievements(studentId: string) {
    const allAchievements = await this.achievementRepo.find({ order: { title: "ASC" } });
    const studentAchievements = await this.studentAchievementRepo.find({ where: { studentId } });
    
    const unlockedMap = new Map();
    for (const sa of studentAchievements) {
      unlockedMap.set(sa.achievementId, sa.unlockedAt);
    }
    
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    const totalQuestsCountCache: Record<string, number> = {};
    const results = [];

    for (const a of allAchievements) {
      const isUnlocked = unlockedMap.has(a.id);
      let currentProgress = 0;
      let progressPercent = 0;

      if (isUnlocked) {
        currentProgress = a.criteriaTarget;
        progressPercent = 100;
      } else {
        currentProgress = await this.getProgressForAchievement(a, studentId, student, totalQuestsCountCache);
        
        if (a.criteriaTarget <= 0) {
          progressPercent = 100;
        } else {
          progressPercent = Math.min(Math.round((currentProgress / a.criteriaTarget) * 100), 100);
        }
      }

      results.push({
        ...a,
        isUnlocked,
        unlockedAt: unlockedMap.get(a.id) || null,
        currentProgress,
        progressPercent,
      });
    }

    return results;
  }
}

