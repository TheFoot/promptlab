// Import ESLint plugins
import js from "@eslint/js";
import googleStyleGuide from "eslint-config-google";
import globals from "globals";

// Define the ESLint configuration
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Google style guide rules
    ...googleStyleGuide,
    // Override certain rules from Google style guide
    rules: {
      "max-len": ["error", { code: 100, ignoreComments: true }],
      "object-curly-spacing": ["error", "always"],
      "require-jsdoc": "off",
      "valid-jsdoc": "off",
    },
  },
  {
    // Project-specific ignores patterns
    ignores: ["node_modules/**", "coverage/**"],
  },
];
