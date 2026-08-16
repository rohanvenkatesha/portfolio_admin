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
  ]),
  /**
   * Third-party components, kept byte-for-byte so they can be re-fetched from
   * upstream without replaying local edits. Their `any`s are theirs; linting
   * them only creates pressure to fork code we deliberately do not own.
   * Type checking still applies — only the style rule is relaxed.
   */
  {
    files: ["components/vendor/**"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
]);

export default eslintConfig;
