import { defineConfig } from "tsdown";

// tsdown defaults `fixedExtension` to true on the node platform, which emits
// .mjs/.d.mts. The published package points at dist/cli.js, dist/index.js and
// dist/index.d.ts, so keep the plain extensions ("type": "module" already makes
// .js ESM).
export default defineConfig([
  {
    // Object form so the shebang lands only on the JS chunk, not the .d.ts.
    banner: { js: "#!/usr/bin/env node" },
    clean: true,
    dts: false,
    entry: { cli: "src/cli.ts" },
    fixedExtension: false,
    format: ["esm"],
    platform: "node",
    sourcemap: true,
    target: "node22",
  },
  {
    dts: true,
    entry: { index: "src/index.ts" },
    fixedExtension: false,
    format: ["esm"],
    platform: "node",
    sourcemap: true,
    target: "node22",
  },
]);
