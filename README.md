# BloodSync

BloodSync is a fresh, open-source blood donation coordination platform by **Atanu Bera**. The reference project informed its feature map; no reference source was copied.

## Status

Phase 2 MVP is implemented and locally verified; the product is not ready for real-world use. Patients can create, edit, close and inspect their own requests. Donors can submit screening profiles, await admin approval, see redacted compatible requests, and explicitly share interest. Request owners can see an interested donor's name and account email after that choice. Administrators can review pending donors and audit decisions. The API stores Argon2id password hashes, rotates hashed refresh sessions, checks cookie mutation origins and locks accounts after repeated failed logins.

Do not use this version with real patient or donor data. Independent security and clinical workflow reviews are recommended before real-world use. See `PHASE2_AUDIT.md` for outstanding launch requirements.

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
- PostgreSQL/PostGIS via Prisma for nearby matching (50 km) with a same-city fallback; Redis is provisioned for Phase 3 distributed rate limiting; a basic per-process auth limiter is active now

## Donor screening defaults

Minimum age 18, maximum age 65, minimum weight **45 kg**, minimum gap **90 days**, configured in `packages/shared/src/eligibility.ts`. The owner identified 45 kg in the reference donor guidance; its README says 50 kg. The discrepancy is documented in `PLAN.md`. These values require local clinical review and are never medical clearance.

## License

MIT © 2026 Atanu Bera. See `LICENSE`.

To provision an administrator, first verify the account, then run `pnpm --filter @bloodsync/api admin:provision person@example.com` from a trusted operator shell. There is no public admin signup path.

Run `bash scripts/run-integration.sh` after starting PostGIS and Mailpit and applying migrations to repeat the auth and Phase 2 route tests. See `PHASE1_AUDIT.md` and `PHASE2_AUDIT.md` for verification details and remaining work.

## Duplicate email response

Signup keeps the generic message “Unable to create account with these details” for an existing address, including a concurrent uniqueness conflict. This avoids making the registration endpoint a direct account lookup. The UI tells people to check their details or use another email. Password-reset and verification resend responses are generic for the same reason. Rate limiting still matters because timing differences and email delivery can leak information indirectly.

## MVP privacy and medical boundaries

Donor contact details are shared only with a request owner after that donor responds. Public matching results are redacted. Coordinates are rounded to two decimal places before storage, and city matching works without coordinates. Matching uses red-cell ABO/Rh compatibility as a coordination aid only; hospitals must confirm compatibility and eligibility. Request expiry is enforced in matching queries and refreshed when an owner reads the request. Bank inventory, queued email alerts, and SSE alerts are deferred to v2.
