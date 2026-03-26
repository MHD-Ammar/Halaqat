/**
 * Daily Submission Entity
 *
 * Stores daily challenge submissions for various campaigns (Ramadan, Summer, etc.)
 * One submission per student per day per campaign.
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";

import { Campaign } from "./campaign.entity";
import { BaseEntity } from "../../common/entities/base.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";
import { Student } from "../../students/entities/student.entity";

@Entity("daily_submission")
@Unique(["studentId", "submissionDate", "campaignId"])
export class DailySubmission extends BaseEntity {
  /**
   * Date of the submission (YYYY-MM-DD)
   * We store as date type to easily enforce one-per-day
   */
  @Column({ name: "submission_date", type: "date" })
  @Index()
  submissionDate!: string;

  /**
   * The campaign this submission belongs to
   */
  @ManyToOne(() => Campaign, (campaign) => campaign.submissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "campaign_id" })
  campaign!: Campaign;

  @Column({ name: "campaign_id", type: "uuid" })
  @Index()
  campaignId!: string;

  /**
   * Raw form data stored as JSON
   * e.g. { prayers: { fajr: 'mosque' }, ... }
   */
  @Column({ name: "submission_data", type: "jsonb" })
  submissionData!: Record<string, any>;

  /**
   * Total XP earned for this submission (calculated server-side)
   */
  @Column({ name: "xp_earned", type: "int" })
  xpEarned!: number;

  /**
   * Current streak at the time of this submission
   */
  @Column({ type: "int", default: 1 })
  streak!: number;

  /**
   * The student who submitted
   */
  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  /**
   * The mosque this submission belongs to
   * (Denormalized for easier leaderboard queries)
   */
  @ManyToOne(() => Mosque, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque;

  @Column({ name: "mosque_id", type: "uuid" })
  @Index()
  mosqueId!: string;
}
