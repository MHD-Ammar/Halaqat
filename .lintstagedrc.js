const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

module.exports = {
  // Run ESLint on changes to JS/TS files
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  // Run Prettier on other files (optional, can enable if you want)
  // '*.{json,css,md}': ['prettier --write'], 
};
