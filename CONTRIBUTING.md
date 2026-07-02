# Contributing to allmd

Thanks for your interest in improving allmd. This is a Turborepo monorepo with
npm workspaces: `apps/cli` (the published `allmd` package), `apps/web` (the
Next.js marketing site), and `apps/docs` (MDX documentation source).

## Setup

Requires Node.js 22.12 or newer.

```bash
git clone https://github.com/mblode/allmd.git
cd allmd
npm install
npm run build
```

AI-backed converters need `OPENAI_API_KEY`, and web conversion needs
`FIRECRAWL_API_KEY`. Put them in `apps/cli/.env` or your environment. Video and
audio conversion uses the bundled `ffmpeg-static` binary.

## Development

Run from the repository root:

```bash
npm run dev          # turbo dev across workspaces
npm run build        # turbo build
npm run test         # unit tests (vitest in apps/cli)
npm run lint         # biome in apps/cli, oxlint in apps/web
npm run typecheck    # tsc --noEmit across workspaces
npm run check        # ultracite check (formatting + lint, whole repo)
npm run fix          # ultracite fix
```

CLI end-to-end tests build and pack `apps/cli`, install the tarball into an
isolated global npm prefix, and exercise the installed binary:

```bash
npm run test:e2e         # offline e2e
npm run test:e2e:live    # includes live conversion smoke tests (needs API keys)
```

## Changesets

Any change to `apps/cli` (the published package) must include a changeset so the
release can be versioned and published:

```bash
npm run changeset
```

Pick the appropriate bump (patch/minor/major) and describe the change. Changes
limited to `apps/web` or `apps/docs` do not need a changeset. CI runs
`changeset status` on pull requests and will flag a missing changeset.

## Pull requests

- Keep the PR focused on a single change.
- Run `npm run check`, `npm run typecheck`, and `npm run test` before pushing.
- Include a changeset for `apps/cli` changes (see above).
- CI must be green (lint, typecheck, and tests on Node 22 and 24).
