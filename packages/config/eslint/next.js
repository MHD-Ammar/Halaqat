/**
 * Shared ESLint configuration for Next.js apps in Halaqat monorepo
 * Extends next/core-web-vitals to avoid plugin conflicts
 */
module.exports = {
  extends: ["next/core-web-vitals", "prettier"],
  plugins: ["@typescript-eslint"],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    // TypeScript
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],

    // Import Rules (Configured to match index.js but relying on Next's loaded plugin)
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/no-duplicates": "error",

    // General
    "no-console": "warn",
    "prefer-const": "error",
    eqeqeq: ["error", "always"],
  },
};
