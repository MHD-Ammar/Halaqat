// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

module.exports = {
  extends: ["../../packages/config/eslint/index.js", "next/core-web-vitals"],
  parserOptions: {
    project: path.resolve(__dirname, "tsconfig.json"),
    tsconfigRootDir: __dirname,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: path.resolve(__dirname, "tsconfig.json"),
      },
    },
  },
};
