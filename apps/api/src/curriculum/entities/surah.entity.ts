/**
 * Surah Entity
 *
 * Represents a Surah (chapter) of the Holy Quran.
 * Includes Madinah Mushaf page range for each Surah.
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
   * First page of this Surah in Madinah Mushaf (1-604)
   */
  @Column({ name: "start_page", type: "int", default: 1 })
  startPage!: number;

  /**
   * Last page of this Surah in Madinah Mushaf (1-604)
   */
  @Column({ name: "end_page", type: "int", default: 1 })
  endPage!: number;

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
