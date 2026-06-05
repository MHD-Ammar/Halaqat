/**
 * AuthService unit tests
 *
 * Focuses on the timing-attack mitigation and credential validation logic.
 * The service is tested with jest mocks for its dependencies so no database
 * or NestJS DI container is required.
 */

import { jest } from "@jest/globals";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Minimal stubs — only the shape used by AuthService is needed
const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

const mockMosquesService = {
  findByInviteCode: jest.fn(),
};

const mockStudentsService = {
  findByUsername: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(() => "mock.jwt.token"),
};

// Lazy-import so mocks are in place before the module initialises DUMMY_HASH
// (bcrypt.hashSync runs at module load time)
let AuthService: any;

beforeAll(async () => {
  ({ AuthService } = await import("./auth.service"));
});

function makeService() {
  return new AuthService(
    mockUsersService as any,
    mockMosquesService as any,
    mockStudentsService as any,
    mockJwtService as any,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── validateUser ──────────────────────────────────────────────────────────────

describe("AuthService.validateUser", () => {
  it("returns null and still calls bcrypt.compare when user not found (timing safety)", async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    const compareSpy = jest.spyOn(bcrypt, "compare");

    const svc = makeService();
    const result = await svc.validateUser("nobody@example.com", "pass");

    expect(result).toBeNull();
    // Must call bcrypt.compare even though user does not exist
    expect(compareSpy).toHaveBeenCalledTimes(1);
  });

  it("returns null when password is wrong (timing: bcrypt.compare is called)", async () => {
    const hashed = await bcrypt.hash("correct", 10);
    mockUsersService.findByEmail.mockResolvedValue({ id: "u1", password: hashed, role: "TEACHER" });
    const compareSpy = jest.spyOn(bcrypt, "compare");

    const svc = makeService();
    const result = await svc.validateUser("user@example.com", "wrong");

    expect(result).toBeNull();
    expect(compareSpy).toHaveBeenCalledTimes(1);
  });

  it("returns user without password when credentials are correct", async () => {
    const hashed = await bcrypt.hash("secret", 10);
    const user = { id: "u1", email: "user@example.com", password: hashed, role: "TEACHER" };
    mockUsersService.findByEmail.mockResolvedValue(user);

    const svc = makeService();
    const result = await svc.validateUser("user@example.com", "secret");

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("password");
    expect(result?.id).toBe("u1");
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe("AuthService.login", () => {
  it("returns an accessToken on success", async () => {
    const hashed = await bcrypt.hash("pass123", 10);
    mockUsersService.findByEmail.mockResolvedValue({ id: "u2", email: "admin@mosque.com", password: hashed, role: "ADMIN", fullName: "Admin", mosqueId: "m1" });

    const svc = makeService();
    const result = await svc.login({ email: "admin@mosque.com", password: "pass123" });

    expect(result).toHaveProperty("accessToken");
    expect(typeof result.accessToken).toBe("string");
  });

  it("throws UnauthorizedException when credentials are invalid", async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);

    const svc = makeService();
    await expect(
      svc.login({ email: "x@x.com", password: "wrong" }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
