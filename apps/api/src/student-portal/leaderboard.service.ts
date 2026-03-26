import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LeagueService } from "../gamification/league.service";
import { Student } from "../students/entities/student.entity";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  totalXp: number;
  currentLevel: number;
  activeTitle: string | null;
  activeAvatarFrame: string | null;
}

export interface LeagueLeaderboardResponse {
  leagueName: string;
  leagueNameAr: string;
  leagueIcon: string;
  leagueRank: number;
  weekEndsAt: string;
  students: Array<LeaderboardEntry & {
    weeklyXp: number;
    promotionZone: boolean;
    relegationZone: boolean;
  }>;
  myRank: number;
  myWeeklyXp: number;
  promotionThreshold: number;
  relegationThreshold: number;
}

@Injectable()
export class StudentPortalLeaderboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly leagueService: LeagueService,
  ) {}

  private async getStudentOrFail(studentId: string, mosqueId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, mosqueId },
      select: ["id", "circleId", "totalXp", "currentLevel"],
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return student;
  }

  private async computeMyRank(
    topStudents: Student[],
    studentId: string,
    myTotalXp: number,
    baseQuery: ReturnType<Repository<Student>["createQueryBuilder"]>,
  ): Promise<number> {
    const index = topStudents.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      return index + 1;
    }

    const countHigherXp = await baseQuery
      .andWhere("student.total_xp > :myTotalXp", { myTotalXp })
      .getCount();

    return countHigherXp + 1;
  }

  private mapToEntries(students: Student[]): LeaderboardEntry[] {
    return students.map((s, idx) => ({
      rank: idx + 1,
      id: s.id,
      name: s.name,
      totalXp: s.totalXp,
      currentLevel: s.currentLevel,
      activeTitle: s.activeTitle,
      activeAvatarFrame: s.activeAvatarFrame,
    }));
  }

  async getCircleLeaderboard(studentId: string, mosqueId: string) {
    const student = await this.getStudentOrFail(studentId, mosqueId);

    if (!student.circleId) {
      return { students: [], myRank: 0 };
    }

    const query = this.studentRepo.createQueryBuilder("student")
      .where("student.mosque_id = :mosqueId", { mosqueId })
      .andWhere("student.circle_id = :circleId", { circleId: student.circleId });

    const topStudents = await query.clone()
      .orderBy("student.total_xp", "DESC")
      .addOrderBy("student.name", "ASC")
      .limit(20)
      .getMany();

    const myRank = await this.computeMyRank(topStudents, studentId, student.totalXp, query.clone());

    return {
      students: this.mapToEntries(topStudents),
      myRank,
    };
  }

  async getMosqueLeaderboard(studentId: string, mosqueId: string) {
    const student = await this.getStudentOrFail(studentId, mosqueId);

    const query = this.studentRepo.createQueryBuilder("student")
      .where("student.mosque_id = :mosqueId", { mosqueId });

    const topStudents = await query.clone()
      .orderBy("student.total_xp", "DESC")
      .addOrderBy("student.name", "ASC")
      .limit(50)
      .getMany();

    const myRank = await this.computeMyRank(topStudents, studentId, student.totalXp, query.clone());

    return {
      students: this.mapToEntries(topStudents),
      myRank,
    };
  }

  async getLeagueLeaderboard(studentId: string, mosqueId: string): Promise<LeagueLeaderboardResponse> {
    await this.getStudentOrFail(studentId, mosqueId);
    return this.leagueService.getLeagueLeaderboard(studentId, mosqueId);
  }
}
