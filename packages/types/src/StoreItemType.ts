/**
 * StoreItemType
 *
 * Defines the types of items available in the reward store.
 */
export enum StoreItemType {
  STREAK_SHIELD = 'STREAK_SHIELD',
  AVATAR_FRAME = 'AVATAR_FRAME',
  TITLE = 'TITLE',
  DOUBLE_XP = 'DOUBLE_XP',
  REAL_WORLD = 'REAL_WORLD', // Admin-configured physical prizes
}

/**
 * Validates if a string is a valid StoreItemType
 */
export function isStoreItemType(value: any): value is StoreItemType {
  return Object.values(StoreItemType).includes(value);
}
