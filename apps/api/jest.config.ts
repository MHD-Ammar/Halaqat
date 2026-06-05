import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.(spec|e2e\\.spec)\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: {
          // Inline overrides so ts-jest doesn't need to resolve
          // the workspace "extends" chain during CI.
          module: "CommonJS",
          moduleResolution: "node",
          target: "ES2022",
          strict: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  // Calculators live under student-portal/calculators/ and have no DB deps —
  // they should reach 100 % line coverage.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.e2e.spec.ts",
    "!src/main.ts",
  ],
  coverageDirectory: "./coverage",
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 40,
      functions: 50,
      statements: 60,
    },
    "src/student-portal/calculators/**/*.ts": {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100,
    },
  },
  testEnvironment: "node",
  // Path aliases (@/ → src/) used by the calculators' imports.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
