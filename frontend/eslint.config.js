// Import ESLint plugins
import js from "@eslint/js";
import vuePlugin from "eslint-plugin-vue";
import globals from "globals";

// Define the ESLint configuration
export default [
  js.configs.recommended,
  // Vue plugin recommended configuration
  ...vuePlugin.configs["flat/recommended"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // Define Vue-specific globals
        __APP_VERSION__: "readonly",
        // Testing globals
        afterEach: "readonly",
        vi: "readonly",
      },
      // Ensure Vue-specific parser options
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Custom rules
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off", // We're using marked for safe HTML rendering
    },
  },
  {
    // Project-specific ignores patterns
    ignores: ["node_modules/**", "dist/**", "coverage/**"],
  },
];
