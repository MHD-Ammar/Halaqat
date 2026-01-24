/**
 * User Entity
 *
 * Represents a user in the Halaqat system.
 * Uses the shared UserRole enum from @halaqat/types.
 */

import {
  Entity,
  Column,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserRole } from "@halaqat/types";
import { Exclude } from "class-transformer";

import { BaseEntity } from "../../common/entities/base.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";

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
   * User's phone number for contact
   */
  @Column({ type: "varchar", length: 20 })
  phoneNumber!: string;

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
   * The mosque this user belongs to
   * Relationship: Many Users -> One Mosque
   */
  @ManyToOne(() => Mosque, (mosque) => mosque.users, {
    onDelete: "CASCADE",
    nullable: true, // Nullable briefly for super-admin or system users
  })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque | null;

  /**
   * Foreign key for the mosque
   */
  @Column({ name: "mosque_id", type: "uuid", nullable: true })
  @Index()
  mosqueId!: string | null;

  /**
   * Circles that this teacher leads
   * Relationship: One Teacher -> Many Circles
   */
  @OneToMany("Circle", "teacher")
  circles!: Circle[];
}
