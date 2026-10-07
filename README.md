# BloodSync

BloodSync is a fresh, open-source blood donation coordination platform by **Atanu Bera**. The reference project informed its feature map; no reference source was copied.

## Status

Phase 1 foundation is implemented and locally verified; the product is not ready for real-world use. The current web app supports account creation, email verification, sign in, password reset, a private dashboard, and sign out. The API stores Argon2id password hashes and rotating, hashed refresh sessions. Donor profiles, requests, matching, admin approval, and production release checks remain to be completed. Do not use this version with real patient or donor data. An independent security review is recommended before real-world use.

## Local development

Requirements: Node 24, pnpm 11, Docker Compose.

1. Copy `.env.example` to `.env` and replace `SESSION_SECRET` with a random 32+ character value. Never commit `.env`.
2. Run `docker compose up -d`.
3. Run `pnpm install`, `pnpm db:generate`, and `pnpm db:migrate`.
4. Export the `.env` values to your shell, then run `pnpm dev`. Verification and reset emails appear in local Mailpit at http://localhost:8025. Web: http://localhost:3000; API: http://localhost:4000.

The default Docker database password is for local development only. Set `NEXT_PUBLIC_API_URL` if the browser cannot reach the API at `http://localhost:4000`.

## Architecture

- `apps/web`: Next.js App Router UI
- `apps/api`: NestJS API
- `packages/shared`: Zod contracts and donor screening constants
- PostgreSQL/PostGIS via Prisma; Redis is provisioned for Phase 3 distributed rate limiting; a basic per-process auth limiter is active now

## Donor screening defaults

Minimum age 18, maximum age 65, minimum weight **45 kg**, minimum gap **90 days**, configured in `packages/shared/src/eligibility.ts`. The owner identified 45 kg in the reference donor guidance; its README says 50 kg. The discrepancy is documented in `PLAN.md`. These values require local clinical review and are never medical clearance.

## License

MIT © 2026 Atanu Bera. See `LICENSE`.

To provision an administrator, first verify the account, then run `pnpm --filter @bloodsync/api admin:provision person@example.com` from a trusted operator shell. There is no public admin signup path.

Run `python3 scripts/smoke-auth.py` after starting the API, PostGIS, and Mailpit to repeat the local auth flow. See `PHASE1_AUDIT.md` for verification details and remaining work.
