import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Student } from "../students/entities/student.entity";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  totalXp: number;
  currentLevel: number;
}

export interface LeagueLeaderboardResponse {
  students: LeaderboardEntry[];
  myRank: number;
  leagueName: string;
  leagueNameAr: string;
}

export const LEAGUE_TIERS = [
  { name: "Bronze", nameAr: "الدوري البرونزي", min: 1, max: 5 },
  { name: "Silver", nameAr: "الدوري الفضي", min: 6, max: 10 },
  { name: "Gold", nameAr: "الدوري الذهبي", min: 11, max: 20 },
  { name: "Diamond", nameAr: "الدوري الماسي", min: 21, max: Infinity },
];

@Injectable()
export class StudentPortalLeaderboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  private getLeagueForLevel(level: number) {
    return LEAGUE_TIERS.find((t) => level >= t.min && level <= t.max) || LEAGUE_TIERS[0]!;
  }

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

    // If not in the top N, we do a simple count of strictly greater XP students in the scope
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
    const student = await this.getStudentOrFail(studentId, mosqueId);

    const league = this.getLeagueForLevel(student.currentLevel);

    const query = this.studentRepo.createQueryBuilder("student")
      .where("student.mosque_id = :mosqueId", { mosqueId })
      .andWhere("student.current_level >= :minLevel", { minLevel: league.min });

    if (league.max !== Infinity) {
      query.andWhere("student.current_level <= :maxLevel", { maxLevel: league.max });
    }

    const topStudents = await query.clone()
      .orderBy("student.total_xp", "DESC")
      .addOrderBy("student.name", "ASC")
      .limit(30)
      .getMany();

    const myRank = await this.computeMyRank(topStudents, studentId, student.totalXp, query.clone());

    return {
      students: this.mapToEntries(topStudents),
      myRank,
      leagueName: league.name,
      leagueNameAr: league.nameAr,
    };
  }
}
