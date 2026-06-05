/**
 * env.ts unit tests
 *
 * We re-import the module in each test by resetting the module registry,
 * so we can inject different process.env values per case.
 */

const originalEnv = process.env;

afterEach(() => {
  // Restore original env after each test
  process.env = originalEnv;
  jest.resetModules();
});

describe("env", () => {
  it("parses valid environment variables correctly", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL:        "http://localhost:3001/api",
      NEXT_PUBLIC_DEFAULT_LOCALE: "ar",
    };

    const { env } = await import("../env");

    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:3001/api");
    expect(env.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("ar");
  });

  it("uses the default API URL when env var is not set", async () => {
    process.env = { ...originalEnv };
    delete process.env["NEXT_PUBLIC_API_URL"];

    const { env } = await import("../env");

    expect(env.NEXT_PUBLIC_API_URL).toBe("http://localhost:3001/api");
  });

  it("throws in development when API URL is an invalid URL", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV:               "development",
      NEXT_PUBLIC_API_URL:    "not-a-url",
    };

    await expect(() => import("../env")).rejects.toThrow();
  });

  it("accepts 'en' as a valid locale", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_DEFAULT_LOCALE: "en",
    };

    const { env } = await import("../env");

    expect(env.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("en");
  });
});
