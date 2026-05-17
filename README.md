# vita-os

VitaOS monorepo. See `../docs/` for the master spec, stack decisions, and runbooks; this README is intentionally short.

## Stack

pnpm workspaces + Turborepo, TypeScript strict, Biome (primary) + ESLint + Prettier, Vitest, Playwright, Storybook, Pino + OpenTelemetry, GitHub Actions, Changesets, Vercel (apps) + Fly.io (workers).

## First clone

```bash
nvm use            # Node 20
corepack enable    # pnpm 9.x
pnpm install
cp .env.example .env.local
pnpm dev
```

## Common scripts

| Script | What it does |
| --- | --- |
| `pnpm build` | Turbo build for every workspace |
| `pnpm dev` | Start every app's dev server |
| `pnpm lint` | Biome + ESLint |
| `pnpm typecheck` | `tsc -b` |
| `pnpm test` | Vitest workspace |
| `pnpm e2e` | Playwright |
| `pnpm ci` | Full local CI pipeline |

## Layout

- `apps/` — operator, tom, tim, MCP servers, workers
- `packages/` — `@vita/core`, `@vita/agents`, SDKs, UI, infra packages
- `infra/` — docker-compose, deploy configs
- `.github/workflows/` — CI, release, deploy, e2e

See `../docs/01-v1-master-spec.md` §32 for the canonical layout and `../docs/04-stack-decisions.md` for stack rationale.
