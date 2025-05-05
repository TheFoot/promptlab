module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    "vue/setup-compiler-macros": true,
  },
  extends: ["plugin:vue/vue3-recommended", "eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "off", // We're using marked for safe HTML rendering
  },
  globals: {
    __APP_VERSION__: "readonly",
    afterEach: "readonly",
    vi: "readonly",
  },
};
