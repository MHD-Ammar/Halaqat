/**
 * Student Entity
 *
 * Represents a student in a study circle (Halqa).
 * Students belong to one circle and can be quickly added with minimal info.
 * Auth credentials (username/passwordHash) are stored directly on this entity
 * rather than via a separate User account, since students are minors.
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { Circle } from "../../circles/entities/circle.entity";
import { BaseEntity } from "../../common/entities/base.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";

@Entity("student")
export class Student extends BaseEntity {
  // ── Personal Info ──────────────────────────────────────────────

  /**
   * Student's full name (required)
   */
  @Column()
  name!: string;

  /**
   * Parent's phone number (optional)
   */
  @Column({ type: "varchar", nullable: true })
  phone!: string | null;

  /**
   * Date of birth (optional)
   */
  @Column({ type: "date", nullable: true })
  dob!: Date | null;

  /**
   * Address (optional)
   */
  @Column({ type: "varchar", nullable: true })
  address!: string | null;

  /**
   * Medical or behavioral notes (optional)
   */
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /**
   * Guardian/Parent name (optional)
   */
  @Column({ name: "guardian_name", type: "varchar", nullable: true })
  guardianName!: string | null;

  /**
   * Guardian/Parent phone number (optional)
   */
  @Column({ name: "guardian_phone", type: "varchar", nullable: true })
  guardianPhone!: string | null;

  // ── Circle Relationship ────────────────────────────────────────

  /**
   * The circle this student belongs to
   * Relationship: Many Students -> One Circle
   */
  @ManyToOne(() => Circle, (circle) => circle.students, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "circle_id" })
  circle!: Circle | null;

  /**
   * Foreign key for the circle
   * Explicitly defined for easy querying
   */
  @Column({ name: "circle_id", type: "uuid", nullable: true })
  @Index()
  circleId!: string | null;

  // ── Auth Credentials ───────────────────────────────────────────

  /**
   * Username for student login (auto-generated)
   * Format: first_name + 4-digit number (e.g., ahmad8492)
   */
  @Column({ type: "varchar", nullable: true, unique: true })
  @Index()
  username!: string | null;

  /**
   * Hashed password for student portal login
   * Hidden by default for security (select: false)
   */
  @Column({ name: "password_hash", type: "varchar", nullable: true, select: false })
  passwordHash!: string | null;

  /**
   * Timestamp of the student's last login
   */
  @Column({ name: "last_login_at", type: "timestamp", nullable: true })
  lastLoginAt!: Date | null;

  /**
   * Timestamp for when the student last claimed the daily login bonus
   * Distinct from lastLoginAt which updates on every session
   */
  @Column({ name: "last_login_bonus_at", type: "timestamp", nullable: true })
  lastLoginBonusAt?: Date | null;

  // ── Gamification ───────────────────────────────────────────────

  /**
   * Total accumulated points (legacy/manual rewards)
   */
  @Column({ name: "total_points", type: "int", default: 0 })
  totalPoints!: number;

  /**
   * Lifetime experience points for the gamification engine
   */
  @Column({ name: "total_xp", type: "int", default: 0 })
  totalXp!: number;

  /**
   * Current level (calculated based on XP thresholds)
   */
  @Column({ name: "current_level", type: "int", default: 1 })
  currentLevel!: number;

  /**
   * Current consecutive daily login/submission streak
   */
  @Column({ name: "current_streak", type: "int", default: 0 })
  currentStreak!: number;

  /**
   * All-time best streak record
   */
  @Column({ name: "max_streak", type: "int", default: 0 })
  maxStreak!: number;

  /** Number of streak shields the student currently owns (max 3) */
  @Column({ name: 'streak_shields', type: 'int', default: 1 })
  streakShields!: number;

  /** Date when the last streak shield was auto-consumed */
  @Column({ name: 'last_shield_used_at', type: 'timestamp', nullable: true })
  lastShieldUsedAt!: Date | null;

  /** The student's currently active title (earned from milestones) */
  @Column({ name: 'active_title', type: 'varchar', nullable: true })
  activeTitle!: string | null;

  /** The student's currently active avatar frame URL (earned from milestones) */
  @Column({ name: 'active_avatar_frame', type: 'varchar', nullable: true })
  activeAvatarFrame!: string | null;

  // ── Multi-tenancy ──────────────────────────────────────────────

  /**
   * The mosque this student belongs to (Multi-tenancy)
   * Relationship: Many Students -> One Mosque
   */
  @ManyToOne(() => Mosque, (mosque) => mosque.students, {
    onDelete: "CASCADE",
    nullable: false, // Every student must belong to a mosque
  })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque;

  /**
   * Foreign key for the mosque
   * Explicitly defined for easy querying and serialization
   */
  @Column({ name: "mosque_id", type: "uuid" })
  @Index()
  mosqueId!: string;
}
