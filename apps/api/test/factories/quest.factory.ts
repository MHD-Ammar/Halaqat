import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { faker } from "@faker-js/faker/locale/ar";
import { Repository } from "typeorm";

import { Quest } from "../../src/quests/entities/quest.entity";

export function buildQuest(overrides: Partial<Quest> = {}): Partial<Quest> {
  return {
    title: `مهمة ${faker.word.noun()}`,
    description: faker.lorem.sentence(),
    category: QuestCategory.GENERAL,
    frequency: QuestFrequency.DAILY,
    xpReward: 10,
    icon: "⭐",
    isActive: true,
    target: 1,
    ...overrides,
  };
}

export async function createQuest(
  repo: Repository<Quest>,
  overrides: Partial<Quest> = {},
): Promise<Quest> {
  return repo.save(repo.create(buildQuest(overrides)));
}

