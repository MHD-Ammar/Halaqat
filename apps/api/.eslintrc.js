/**
 * ESLint configuration for the Halaqat API
 * Extends shared config from @halaqat/config
 */
module.exports = {
  extends: ["../../packages/config/eslint/index.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  root: true,
};
