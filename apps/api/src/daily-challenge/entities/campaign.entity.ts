import { Entity, Column, Index, OneToMany } from "typeorm";

import { DailySubmission } from "./daily-submission.entity";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("campaign")
export class Campaign extends BaseEntity {
  /**
   * Arabic/English title of the campaign
   */
  @Column({ type: "varchar", length: 255 })
  title!: string;

  /**
   * When the campaign starts
   */
  @Column({ name: "start_date", type: "date" })
  @Index()
  startDate!: string;

  /**
   * When the campaign ends
   */
  @Column({ name: "end_date", type: "date" })
  @Index()
  endDate!: string;

  /**
   * Is this the currently active campaign?
   * Used for the main student portal UI
   */
  @Column({ name: "is_active", type: "boolean", default: false })
  @Index()
  isActive!: boolean;

  /**
   * Form configuration for Dynamic Campaign Engine
   * Stored as JSONB containing the array of questions
   */
  @Column({ name: "form_config", type: "jsonb" })
  formConfig!: Record<string, any>;

  /**
   * Submissions attached to this campaign
   */
  @OneToMany(() => DailySubmission, (submission) => submission.campaign)
  submissions!: DailySubmission[];
}
