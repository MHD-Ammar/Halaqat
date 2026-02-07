const path = require('path');

module.exports = {
  // Run eslint directly from root with proper config resolution
  'apps/web/**/*.{js,jsx,ts,tsx}': (filenames) => {
    const files = filenames.map((f) => path.relative(process.cwd(), f)).join(' ');
    return `npx eslint --fix ${files}`;
  },

  // Run eslint on api source files only (exclude config files)
  'apps/api/src/**/*.{js,ts}': (filenames) => {
    const files = filenames.map((f) => path.relative(process.cwd(), f)).join(' ');
    return `npx eslint --fix ${files}`;
  },
};
