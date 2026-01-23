/**
 * Mosque Entity
 *
 * Represents a mosque in the multi-tenant Halaqat system.
 * Each user belongs to one mosque, identified by a unique invite code.
 */

import { Entity, Column, Index } from "typeorm";

import { BaseEntity } from "../../common/entities/base.entity";

@Entity("mosque")
export class Mosque extends BaseEntity {
  /**
   * Name of the mosque
   */
  @Column()
  name!: string;

  /**
   * Unique 6-character invite code for registration
   */
  @Column({ type: "varchar", length: 6, unique: true })
  @Index()
  code!: string;
}
