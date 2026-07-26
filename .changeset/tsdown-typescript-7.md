---
"allmd": patch
---

Build the CLI with tsdown instead of tsup, and upgrade to TypeScript 7. TypeScript 7 removes the JavaScript compiler API tsup's declaration build depended on, and tsup 8.5.1 is its latest release. The published output is unchanged: `dist/cli.js` (executable, with shebang), `dist/index.js`, `dist/index.d.ts`, and source maps, with runtime dependencies left external. Also points `homepage` at the site's new location, `https://blode.co/allmd`.
