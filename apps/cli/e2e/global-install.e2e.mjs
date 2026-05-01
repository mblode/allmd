import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, delimiter as pathDelimiter, resolve } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

const testFile = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(testFile), "..");
const repoRoot = resolve(packageRoot, "../..");
const packageJson = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8")
);

dotenv.config({ path: join(repoRoot, ".env"), quiet: true });
dotenv.config({
  path: join(packageRoot, ".env"),
  override: false,
  quiet: true,
});

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;
const liveMode = process.env.ALLMD_E2E_LIVE === "1";
const helpDescriptionPattern = /Convert various content types to markdown/;
const helpExamplesPattern = /allmd examples/;
const stdoutFlagPattern = /--stdout/;
const examplesHeadingPattern = /Common Workflows/;
const supportedFormatsPattern = /Supported formats/;
const csvUsagePattern = /allmd csv <file>/;
const missingCsvPattern = /File not found: missing\.csv/;
const openAiKeyPattern = /OPENAI_API_KEY/;
const stdinSentinelInvalidUrlPattern = /Invalid URL: -/;
const exampleDomainPattern = /Example Domain/i;
const adaPattern = /Ada/;
const gracePattern = /Grace/;

let tempDir;
let prefixDir;
let binDir;
let allmdBin;
let globalPackageDir;

function testEnv(extra = {}) {
  return {
    ...process.env,
    CI: "1",
    HOME: join(tempDir, "home"),
    NO_UPDATE_NOTIFIER: "1",
    PATH: `${binDir}${pathDelimiter}${process.env.PATH ?? ""}`,
    XDG_CACHE_HOME: join(tempDir, "cache"),
    XDG_CONFIG_HOME: join(tempDir, "config"),
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
    ...extra,
  };
}

async function run(command, args, options = {}) {
  const {
    cwd = packageRoot,
    env = testEnv(),
    input,
    timeoutMs = 30_000,
  } = options;

  return await new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          `Timed out after ${timeoutMs}ms: ${command} ${args.join(" ")}`
        )
      );
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolveResult({ code, signal, stdout, stderr });
    });

    if (input === undefined) {
      child.stdin.end();
    } else {
      child.stdin.end(input);
    }
  });
}

function assertExitOk(result, context) {
  assert.equal(
    result.code,
    0,
    `${context}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

function assertExitFailed(result, context) {
  assert.notEqual(
    result.code,
    0,
    `${context}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

async function runAllmd(args, options = {}) {
  return await run(allmdBin, args, {
    ...options,
    env: options.env ?? testEnv(),
  });
}

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "allmd-e2e-"));
  prefixDir = join(tempDir, "global");
  binDir = isWindows ? prefixDir : join(prefixDir, "bin");
  allmdBin = join(binDir, isWindows ? "allmd.cmd" : "allmd");
  globalPackageDir = isWindows
    ? join(prefixDir, "node_modules", "allmd")
    : join(prefixDir, "lib", "node_modules", "allmd");

  await mkdir(join(tempDir, "home"), { recursive: true });
  const packDir = join(tempDir, "pack");
  await mkdir(packDir, { recursive: true });

  const pack = await run(npmCommand, [
    "pack",
    "--json",
    "--pack-destination",
    packDir,
  ]);
  assertExitOk(pack, "npm pack should succeed");

  const [packed] = JSON.parse(pack.stdout);
  const tarball = packed.path ?? join(packDir, packed.filename);

  const install = await run(
    npmCommand,
    [
      "install",
      "--global",
      "--prefix",
      prefixDir,
      tarball,
      "--no-audit",
      "--no-fund",
    ],
    { timeoutMs: 180_000 }
  );
  assertExitOk(install, "isolated global npm install should succeed");
});

after(async () => {
  if (tempDir) {
    await rm(tempDir, { force: true, recursive: true });
  }
});

describe("globally installed allmd package", () => {
  it("exposes the installed binary and package version", async () => {
    const result = await runAllmd(["--version"]);
    assertExitOk(result, "allmd --version should succeed");
    assert.equal(result.stdout.trim(), packageJson.version);
  });

  it("renders command help from the installed binary", async () => {
    const result = await runAllmd(["--help"]);
    assertExitOk(result, "allmd --help should succeed");
    assert.match(result.stdout, helpDescriptionPattern);
    assert.match(result.stdout, helpExamplesPattern);
    assert.match(result.stdout, stdoutFlagPattern);
  });

  it("renders usage examples from the installed binary", async () => {
    const result = await runAllmd(["examples"]);
    assertExitOk(result, "allmd examples should succeed");
    assert.match(result.stdout, examplesHeadingPattern);
    assert.match(result.stdout, supportedFormatsPattern);
    assert.match(result.stdout, csvUsagePattern);
  });

  it("ships the public ESM API entrypoint", async () => {
    const entrypoint = pathToFileURL(
      join(globalPackageDir, "dist", "index.js")
    ).href;
    const script = `
      const api = await import(${JSON.stringify(entrypoint)});
      const requiredExports = ["convertWeb", "convertCsv", "convertYoutube"];
      for (const name of requiredExports) {
        if (typeof api[name] !== "function") {
          throw new Error(\`Missing export: \${name}\`);
        }
      }
    `;

    const result = await run(nodeCommand, [
      "--input-type=module",
      "--eval",
      script,
    ]);
    assertExitOk(result, "installed ESM API entrypoint should import");
  });

  it("reports file preflight errors before API-key checks", async () => {
    const result = await runAllmd(["csv", "missing.csv"], {
      env: testEnv({ FIRECRAWL_API_KEY: "", OPENAI_API_KEY: "" }),
    });

    assertExitFailed(result, "missing files should fail");
    assert.match(result.stderr, missingCsvPattern);
    assert.doesNotMatch(result.stderr, openAiKeyPattern);
  });

  it("supports stdin sentinel input for URL commands", async () => {
    const result = await runAllmd(["tweet", "-"], {
      env: testEnv({ FIRECRAWL_API_KEY: "", OPENAI_API_KEY: "" }),
      input: "https://x.com/user/status/123\n",
    });

    assertExitFailed(
      result,
      "tweet conversion without OPENAI_API_KEY should fail"
    );
    assert.match(result.stderr, openAiKeyPattern);
    assert.doesNotMatch(result.stderr, stdinSentinelInvalidUrlPattern);
  });
});

describe("optional live conversion smoke tests", () => {
  it("has API keys when ALLMD_E2E_LIVE=1", { skip: !liveMode }, () => {
    assert.ok(
      process.env.FIRECRAWL_API_KEY?.trim(),
      "FIRECRAWL_API_KEY is required for live web E2E"
    );
    assert.ok(
      process.env.OPENAI_API_KEY?.trim(),
      "OPENAI_API_KEY is required for live AI-backed E2E"
    );
  });

  it("converts a live web page through the globally installed binary", {
    skip: !liveMode,
  }, async () => {
    const result = await runAllmd(
      ["web", "https://example.com", "--stdout", "--no-frontmatter"],
      {
        env: testEnv(),
        timeoutMs: 120_000,
      }
    );

    assertExitOk(result, "live web conversion should succeed");
    assert.match(result.stdout, exampleDomainPattern);
  });

  it("converts a local CSV through the globally installed binary and OpenAI path", {
    skip: !liveMode,
  }, async () => {
    const fixture = join(tempDir, "sales.csv");
    await writeFile(
      fixture,
      'name,notes\nAda,"first line\nsecond line"\nGrace,"uses | pipes"\n',
      "utf8"
    );

    const result = await runAllmd(
      ["csv", fixture, "--stdout", "--no-frontmatter"],
      {
        env: testEnv(),
        timeoutMs: 120_000,
      }
    );

    assertExitOk(result, "live CSV conversion should succeed");
    assert.match(result.stdout, adaPattern);
    assert.match(result.stdout, gracePattern);
  });
});
