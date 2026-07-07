import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // Honour the `_`-prefix convention for deliberately-unused bindings,
      // and the `{ omit, ...rest }` idiom used to strip a key from an object.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Manual dev tools (CommonJS, not wired into CI) and generated/vendored
    // output that isn't application source.
    "scripts/**",
    "site/**",
    "design_handoff_mycelia_redesign_extract/**",
  ]),
]);

export default eslintConfig;
