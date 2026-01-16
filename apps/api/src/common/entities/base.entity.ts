/**
 * Base Entity
 *
 * Abstract base entity that all other entities should extend.
 * Provides common fields: id (UUID), timestamps, and soft delete support.
 */

import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

export abstract class BaseEntity {
  /**
   * Unique identifier (UUID v4)
   */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Timestamp when the entity was created
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Timestamp when the entity was last updated
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Soft delete timestamp (null if not deleted)
   * When set, the entity is considered "deleted" but remains in the database
   */
  @DeleteDateColumn()
  deletedAt!: Date | null;
}
