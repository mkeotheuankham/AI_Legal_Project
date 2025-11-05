module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: [
    "dist",
    ".eslintrc.cjs",
    "eslint.config.js",
    "vite.config.ts",
  ],
  parser: "@typescript-eslint/parser",

  // --- ‼️ ເພີ່ມສ່ວນນີ້ ເພື່ອແກ້ໄຂ Error ‼️ ---
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    // ບອກ ESLint ໃຫ້ອ່ານ tsconfig.json ທີ່ຢູ່ໃນ folder ດຽວກັນ (frontend)
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname, // ບອກວ່າ root ຂອງ tsconfig ແມ່ນ folder ນີ້ (frontend)
  },
  // --- ສິ້ນສຸດສ່ວນທີ່ເພີ່ມ ---

  plugins: ["react-refresh", "@typescript-eslint"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
};
