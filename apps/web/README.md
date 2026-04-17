# @allmd/web

Next.js 16 marketing site for `allmd`, plus the app-layer redirects and metadata used by the hosted docs experience.

## Getting Started

From the repo root:

```bash
npm install
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

Run these inside `apps/web`:

```bash
npm run dev
npm run build
npm run start
npm run check
npm run fix
```

`npm run check` runs lint, format checking, and TypeScript checks.

## Structure

- `app/(marketing)` contains the landing page routes
- `lib/config.ts` defines site metadata and external links
- `next.config.js` injects the CLI version into `ALLMD_VERSION` and rewrites `/docs` to the hosted docs
- `scripts/build-well-known-skills.mjs` runs before production builds

## Notes

- The package is private and is deployed as part of the monorepo.
- Use the root [`README.md`](../../README.md) for repo-wide setup, testing, and release commands.

## License

Covered by the repository MIT license in [`../../LICENSE.md`](../../LICENSE.md).
