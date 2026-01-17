/**
 * Surah Entity
 *
 * Represents a Surah (chapter) of the Holy Quran.
 * Designed to be scalable for other reference materials.
 */

import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { MaterialType } from "@halaqat/types";

@Entity("surah")
export class Surah {
  /**
   * Auto-generated primary key
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Surah number (1-114 for Quran)
   * Unique constraint for upsert operations
   */
  @Column({ unique: true })
  @Index()
  number!: number;

  /**
   * Arabic name of the Surah
   */
  @Column()
  nameArabic!: string;

  /**
   * English transliteration of the Surah name
   */
  @Column()
  nameEnglish!: string;

  /**
   * Total number of verses in the Surah
   */
  @Column()
  verseCount!: number;

  /**
   * Type of reference material
   */
  @Column({
    type: "enum",
    enum: MaterialType,
    default: MaterialType.QURAN,
  })
  type!: MaterialType;
}
