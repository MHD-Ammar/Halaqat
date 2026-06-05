import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, LessThanOrEqual, Repository } from "typeorm";

import { MilestoneReward, RewardType } from "../../gamification/entities/milestone-reward.entity";
import { StudentMilestone } from "../../gamification/entities/student-milestone.entity";
import { Student } from "../../students/entities/student.entity";
import { calculateLevelFromXp } from "../calculators/level.calculator";

@Injectable()
export class MilestoneUnlockService {
  private readonly logger = new Logger(MilestoneUnlockService.name);

  constructor(
    @InjectRepository(StudentMilestone)
    private readonly studentMilestoneRepo: Repository<StudentMilestone>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async unlockForLevel(
    manager: EntityManager,
    studentId: string,
    newLevel: number,
  ): Promise<StudentMilestone[]> {
    const eligible = await manager.find(MilestoneReward, {
      where: { targetLevel: LessThanOrEqual(newLevel) },
    });
    if (eligible.length === 0) return [];

    const existing = await manager.find(StudentMilestone, { where: { studentId } });
    const existingIds = new Set(existing.map((sm) => sm.milestoneId));

    const missing = eligible.filter((m) => !existingIds.has(m.id));
    if (missing.length === 0) return [];

    const toCreate = missing.map((m) =>
      manager.create(StudentMilestone, {
        studentId,
        milestoneId: m.id,
        isClaimed: false,
        unlockedAt: new Date(),
      }),
    );
    return manager.save(StudentMilestone, toCreate);
  }

  async getStudentMilestones(studentId: string): Promise<StudentMilestone[]> {
    const milestones = await this.studentMilestoneRepo.find({
      where: { studentId },
      relations: ["milestone"],
      order: { milestone: { targetLevel: "ASC" } },
    });
    return milestones.filter((sm) => sm.milestone);
  }

  async claimMilestone(studentId: string, milestoneId: string) {
    const studentMilestone = await this.studentMilestoneRepo.findOne({
      where: { id: milestoneId, studentId },
      relations: ["milestone"],
    });

    if (!studentMilestone) throw new NotFoundException("Milestone not found or not unlocked yet");
    if (studentMilestone.isClaimed) throw new BadRequestException("Milestone already claimed");

    if (!studentMilestone.milestone) {
      throw new InternalServerErrorException(
        `Milestone definition not found for student milestone ${milestoneId}. This usually happens if the milestone_rewards table was wiped but student records remain.`,
      );
    }

    studentMilestone.isClaimed = true;
    let rewardGiven = false;
    let newTotalXp: number | undefined;
    const { rewardType, rewardValue } = studentMilestone.milestone;

    if (rewardType === RewardType.BONUS_XP) {
      const bonusXp = parseInt(rewardValue, 10);
      if (!isNaN(bonusXp)) {
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (student) {
          student.totalXp += bonusXp;
          student.currentLevel = calculateLevelFromXp(student.totalXp);
          await this.studentRepo.save(student);
          newTotalXp = student.totalXp;
          rewardGiven = true;
        }
      }
    } else if (rewardType === RewardType.TITLE) {
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      if (student) {
        student.activeTitle = rewardValue;
        await this.studentRepo.save(student);
        rewardGiven = true;
      }
    } else if (rewardType === RewardType.AVATAR_FRAME) {
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      if (student) {
        student.activeAvatarFrame = rewardValue;
        await this.studentRepo.save(student);
        rewardGiven = true;
      }
    } else {
      this.logger.warn(`Unknown reward type: ${rewardType} for milestone ${milestoneId}`);
    }

    await this.studentMilestoneRepo.save(studentMilestone);

    return {
      success: true,
      rewardDetails: { type: rewardType, value: rewardValue, applied: rewardGiven },
      newTotalXp,
    };
  }
}
