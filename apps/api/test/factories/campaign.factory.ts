import { faker } from "@faker-js/faker/locale/ar";
import { Repository } from "typeorm";

import { Campaign } from "../../src/daily-challenge/entities/campaign.entity";

export function buildCampaign(overrides: Partial<Campaign> = {}): Partial<Campaign> {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);

  return {
    title: `حملة ${faker.word.noun()}`,
    startDate: now.toISOString().split("T")[0] ?? "",
    endDate: end.toISOString().split("T")[0] ?? "",
    isActive: true,
    formConfig: {
      submitted_xp: 1,
      questions: [],
    },
    ...overrides,
  };
}

export async function createCampaign(
  repo: Repository<Campaign>,
  overrides: Partial<Campaign> = {},
): Promise<Campaign> {
  return repo.save(repo.create(buildCampaign(overrides)));
}

