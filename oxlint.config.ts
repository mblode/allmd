import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";

export default defineConfig({
  extends: [core, next],
  ignorePatterns: core.ignorePatterns,
  // The CLI predates Ultracite's oxlint ruleset (it was previously linted with
  // Biome), so oxlint core flags a large body of pre-existing stylistic
  // choices. Each rule below needs a wide mechanical refactor with no safe
  // autofix and no behavioural benefit, so they're deferred rather than churned
  // as part of a dependency upgrade. Every other Ultracite rule is enforced.
  rules: {
    // Function declarations are used throughout the CLI; converting all to
    // expressions also fights hoisting.
    "func-style": "off",
    "no-use-before-define": "off",
    // Reordering keys across the converter dispatch maps and option objects is
    // churn with no behavioural benefit.
    "sort-keys": "off",
    // Regex style: the CLI's many extraction patterns are not written in
    // unicode mode; adding the `u`/named-capture-group form is a risky rewrite.
    "require-unicode-regexp": "off",
    "prefer-named-capture-group": "off",
    "unicorn/prefer-string-replace-all": "off",
    // Idiomatic loops and numeric parsing used across converters.
    "no-plusplus": "off",
    "no-await-in-loop": "off",
    "unicorn/prefer-number-coercion": "off",
    "unicorn/prefer-array-find": "off",
    "unicorn/no-array-sort": "off",
    "unicorn/no-immediate-mutation": "off",
    "unicorn/no-await-expression-member": "off",
    // Import and type-style preferences that differ from the previous Biome
    // config.
    "import/first": "off",
    "unicorn/import-style": "off",
    "typescript/consistent-type-imports": "off",
    "typescript/method-signature-style": "off",
    "typescript/no-non-null-assertion": "off",
    "prefer-destructuring": "off",
    "arrow-body-style": "off",
    "no-inline-comments": "off",
    "no-shadow": "off",
    // Error-handling and control-flow idioms present in the existing code.
    "preserve-caught-error": "off",
    "no-promise-executor-return": "off",
    "no-eq-null": "off",
    eqeqeq: "off",
    "require-await": "off",
    "unicorn/consistent-function-scoping": "off",
    // A couple of large modules exceed these thresholds; splitting them is out
    // of scope for the dependency upgrade.
    complexity: "off",
    "max-classes-per-file": "off",
    "promise/avoid-new": "off",
    "promise/param-names": "off",
    "no-img-element": "off",
  },
});
