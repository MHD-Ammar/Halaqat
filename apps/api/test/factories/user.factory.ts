import { UserRole } from "@halaqat/types";
import { faker } from "@faker-js/faker/locale/ar";
import { Repository } from "typeorm";

import { User } from "../../src/users/entities/user.entity";

export function buildUser(overrides: Partial<User> = {}): Partial<User> {
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phoneNumber: faker.phone.number("+9665########"),
    password: "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345",
    role: UserRole.TEACHER,
    isActive: true,
    ...overrides,
  };
}

export async function createUser(
  repo: Repository<User>,
  overrides: Partial<User> = {},
): Promise<User> {
  return repo.save(repo.create(buildUser(overrides)));
}

