/**
 * Quest Frequency
 *
 * Defines how often a quest can be completed.
 */
export enum QuestFrequency {
  /** Can be completed once per day */
  DAILY = "DAILY",
  /** Can be completed once per week */
  WEEKLY = "WEEKLY",
  /** Can only be completed once ever */
  ONETIME = "ONETIME",
}
