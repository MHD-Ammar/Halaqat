/**
 * ESLint configuration for Halaqat Web
 */
module.exports = {
  extends: ["@halaqat/config/eslint", "next/core-web-vitals"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
