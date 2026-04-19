/** @type {import('postcss').Config} */
const path = require("path");
module.exports = {
  plugins: {
    // postcss-import must come first so @import statements in globals.css
    // (including the brand tokens) are resolved before Tailwind processes the file.
    "postcss-import": {},
    tailwindcss: {
      config: path.join(__dirname, "tailwind.config.js"),
    },
    autoprefixer: {},
  },
};
