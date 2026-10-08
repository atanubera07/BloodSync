# Contributing

BloodSync handles sensitive coordination data. **Never submit real patient or donor health data** in issues, tests, screenshots, pull requests, or logs. Use synthetic examples only.

## Development setup

1. Install Node 24 (`nvm use`), pnpm 11 and Docker Compose.
2. Copy `.env.example` to `.env` and replace the local session secret.
3. Run `docker compose up -d`, `pnpm install`, `pnpm db:generate`, `pnpm db:migrate`, then `pnpm dev`.
4. Visit the web app at `http://localhost:3000`, Mailpit at `http://localhost:8025`, and API readiness at `http://localhost:4000/health/ready`.

The root `pnpm dev` and `pnpm db:migrate` commands load `.env` automatically. Do not commit `.env`.

## Branches and commits

Open an issue before a large change. Create a short branch such as `fix/session-rotation` or `feat/request-search`. Keep commits small and use Conventional Commits, for example `fix(api): reject stale donor approval`. Avoid unrelated formatting in a functional commit.

## Checks

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. With PostGIS, Redis and Mailpit running, run `bash scripts/run-integration.sh`. Browser checks use `node scripts/browser-check.mjs` against a running web app. Add role, ownership, consent and error-path tests when changing an API route. Run Prisma migrations against synthetic local data only.

## Pull request checklist

- Explain the behavior changed and why.
- Include meaningful tests or explain why none are needed.
- Run the checks above and report actual results.
- Review security, privacy, accessibility and error states affected by the change.
- Confirm that all examples and screenshots contain synthetic data.

Report vulnerabilities privately through [SECURITY.md](SECURITY.md). Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
