import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Mesa design system is vendored reference material, not project
    // source. Its marketing UI kit ships JSX with components resolved at use
    // site, so linting it reports 44 errors about a kit this project never
    // imports — noise that would train everyone to ignore a red lint run.
    ".claude/**",
  ]),
]);

export default eslintConfig;
