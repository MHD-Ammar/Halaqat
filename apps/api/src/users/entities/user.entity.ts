/**
 * User Entity
 *
 * Represents a user in the Halaqat system.
 * Uses the shared UserRole enum from @halaqat/types.
 */

import { Entity, Column, Index, OneToMany } from "typeorm";
import { UserRole } from "@halaqat/types";
import { Exclude } from "class-transformer";

import { BaseEntity } from "../../common/entities/base.entity";

// Forward reference to avoid circular dependency
import type { Circle } from "../../circles/entities/circle.entity";

@Entity("user")
export class User extends BaseEntity {
  /**
   * User's email address (unique identifier for login)
   */
  @Column({ unique: true })
  @Index()
  email!: string;

  /**
   * Hashed password (never store plain text passwords!)
   * Excluded from serialization for security
   */
  @Column()
  @Exclude({ toPlainOnly: true })
  password!: string;

  /**
   * User's full name for display purposes
   */
  @Column()
  fullName!: string;

  /**
   * User role determines permissions and access level
   * Uses the shared UserRole enum from @halaqat/types
   */
  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.TEACHER,
  })
  role!: UserRole;

  /**
   * Multi-tenancy support: Links user to a specific mosque
   * Nullable for now to prepare for future SaaS capabilities
   */
  @Column({ type: "uuid", nullable: true })
  @Index()
  mosqueId!: string | null;

  /**
   * Circles that this teacher leads
   * Relationship: One Teacher -> Many Circles
   */
  @OneToMany("Circle", "teacher")
  circles!: Circle[];
}
