/**
 * User Entity
 *
 * Represents a user in the Halaqat system.
 * Uses the shared UserRole enum from @halaqat/types.
 */

import { Entity, Column, Index } from "typeorm";
import { UserRole } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";

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
   */
  @Column()
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
}
