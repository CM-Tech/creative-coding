module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "one-var": ["error", "never"],
    "@typescript-eslint/no-non-null-assertion": "off",
  },
  parserOptions: {
    project: "./tsconfig.json",
  },
};
