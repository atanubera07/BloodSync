# BloodSync

Open-source blood donation coordination software by **Atanu Bera**. The reference project informed the feature map; no reference source was copied.

**Status:** A synthetic-data prototype is [deployed on Vercel](https://bloodsync-ivory.vercel.app). **Do not enter real patient or donor data.** Clinical, legal, independent security, backup and recovery reviews remain open. See the [latest security check](docs/FRONTEND_SECURITY_AUDIT_2026-10-09.md) and [phase audits](docs/PHASE6_AUDIT.md).

The [current product review](docs/PRODUCT_REVIEW_2026-10-26.md) records the release evidence, fixes awaiting verification, and open product gaps. The [earlier refinement check](docs/PRODUCT_REFINEMENT_2026-10-11.md) records the account and dashboard workflow changes.

![BloodSync redesigned home page on desktop](docs/redesign/screenshots/after-home-1440.jpg)

[View the mobile redesign and before/after review](docs/redesign/REVIEW.md)

## What works

- Account signup, email verification, sign-in, rotating refresh sessions, password reset and account lockout.
- Patient-owned requests with expiry, approved donor profiles and nearby, redacted matching.
- Donor interest with current, explicit contact-sharing consent, administrator approval and audit events.
- Account data export, password-confirmed deletion and consent withdrawal.
- Account detail review and editing for optional signup fields, plus dashboard guidance based on donor approval and request history.

Bank inventory, queued email alerts and SSE alerts are deferred to v2. BloodSync does not give medical advice or confirm donor eligibility or blood compatibility.

### How the MVP works

```mermaid
flowchart LR
    Patient[Patient creates request] --> Request[Private request]
    Donor[Donor creates profile] --> Approval[Admin reviews donor]
    Approval --> Match[Approved donor sees redacted matches]
    Request --> Match
    Match --> Interest[Donor expresses interest with consent]
    Interest --> Contact[Request owner receives contact details]
```

The request owner controls each request. Administrators review donor profiles; they do not create donor or patient accounts on behalf of users. Contact details appear only after a donor expresses interest with current consent.

## Five-minute local setup

Requirements: Node 24, pnpm 11, Docker Compose.

1. Copy `.env.example` to `.env` and replace `SESSION_SECRET` with a random value of at least 32 characters. Never commit `.env`.
2. Run `docker compose up -d`.
3. Run `pnpm install && pnpm db:generate && pnpm db:migrate`.
4. Run `pnpm dev`; the root command loads `.env` for both apps.
5. Open `http://localhost:3000`. Verification and reset messages appear in Mailpit at `http://localhost:8025`. API liveness and readiness are at `/health/live` and `/health/ready`; the API is versioned under `/v1`, with OpenAPI documentation at `/v1/docs`. On Vercel, use `/api/v1/health/live` and `/api/v1/health/ready`.

The Compose database credentials are for local development only. The web app proxies `/api` to `API_ORIGIN` so the browser and API cookies share one host. A non-Vercel production build requires explicit HTTPS `API_ORIGIN` and `SITE_URL`; the API requires a non-local `SMTP_HOST` and `MAIL_FROM`. The Vercel configuration uses two Services, Vercel Queues for account email, and a daily Cron for request expiry; see [the Vercel deployment guide](docs/VERCEL_DEPLOYMENT.md). Set `TRUST_PROXY_HOPS` to the exact number of trusted reverse proxies between the client and API: use `1` only for a topology with one proxy, such as a dedicated Next.js proxy, and `0` for direct connections. Block direct public access to the API when trusting forwarded IP headers. The API warns at startup if production uses `0`; this is a prompt to verify the topology, not a reason to guess a hop count.

## Architecture

```mermaid
flowchart LR
    Browser[Browser] -->|pages| Web[Next.js web]
    Browser -->|same-origin /api, session cookies| API[NestJS API]
    Web -->|apiJson, CSRF and refresh handling| API
    API -->|requests and matching| DB[(PostgreSQL + PostGIS)]
    API -->|rate limits and registration Bloom filter| Redis[(Redis)]
    API -->|verification and reset jobs| Queue[Vercel Queue]
    Queue --> Consumer[Next.js queue consumer]
    Consumer -->|internal authenticated call| API
    API --> SMTP[SMTP]
    Cron[Vercel Cron] -->|expire requests| API
    Shared[Shared Zod contracts and screening rules] --> Web
    Shared --> API
```

`apps/web` contains the Next.js UI and its shared API client. Vercel routes `/api` to `apps/api`, which enforces roles, ownership, consent, rate limits and CSRF. `packages/shared` contains contracts and configurable screening defaults. Locally, request expiry and account email jobs run through BullMQ. On Vercel, Cron expires requests daily and Vercel Queues dispatches account email through the web consumer. Matching uses indexed PostGIS geography expressions and a 50 km radius with a same-city fallback. No public donor contact endpoint exists.

## Checks and operations

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `bash scripts/run-integration.sh` with PostGIS, Redis and Mailpit running. The integration script uses synthetic accounts. `scripts/browser-check.mjs` and `scripts/browser-auth-check.mjs` use a locally installed Chromium and a running web/API stack; see [RUNBOOK.md](RUNBOOK.md) for operations. Do not run browser checks against real accounts.

For the frontend redesign regression pass, start the web dev server with `pnpm --filter @bloodsync/web dev`, then run `pnpm test:visual`. It uses synthetic, browser-mocked API responses and checks 18 views at five widths, representative axe accessibility rules, keyboard focus, and a protected-route return path. Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`. See the [design system](docs/DESIGN_SYSTEM.md) and [redesign review](docs/redesign/REVIEW.md).

To provision an administrator, verify an account first, then run `pnpm --filter @bloodsync/api admin:provision person@example.com` from a trusted operator shell. There is no public admin signup path.

## Donor screening and privacy

Defaults in `packages/shared/src/eligibility.ts`: age **18–65 years**, minimum weight **45 kg**, and at least **90 days** since the last donation. The owner identified 45 kg in the reference donor guidance; its README says 50 kg. See [the plan](docs/PLAN.md). A qualified local clinician must approve local thresholds and workflows before real use. Hospitals must confirm red-cell compatibility and donor eligibility.

Donor contact details are shown to a request owner only after that donor expresses interest with active consent for the current privacy version. Coordinates are rounded to two decimal places before storage. Withdrawing consent stops matching and removes interests. Account deletion cascades owned data and sessions; only anonymous audit event type, time and result remain. A local legal reviewer must set a retention policy before real use.

Signup keeps the generic duplicate-email `400` response, “Unable to create account with these details”. This avoids a direct account lookup message while telling the caller that signup failed; returning success for an account that was not created would be misleading. If the account is created but email queuing fails, signup still succeeds and the user can request a fresh link on the verification page. Password reset and verification requests enqueue the same job for existing and missing accounts and return a generic response. Email delivery can still reveal an account to someone who controls its mailbox, so rate limits apply.

Registration uses a Redis bitmap-backed Bloom filter to avoid a duplicate-email database read when an address is absent from the filter. It stores HMAC-derived bit positions, not email strings, and uses 128 KiB for approximately 0.7% false positives at 100,000 entries. A positive result is checked in PostgreSQL. The filter is not preloaded with older accounts, so a negative result can still race or miss an existing account; PostgreSQL's unique email constraint remains authoritative and returns the same generic error. Redis failures fall back to the database. No RedisBloom module or new environment variable is required.

## Roadmap and contribution

- Device, offline and representative load validation on a production-like deployment.
- Verify a real canonical domain, crawler rendering, and qualified local content before indexing city or blood-group landing pages.
- Rehearse backups and incident response, then obtain independent security and clinical reviews before any real-world launch.
- v2: blood bank inventory, queued email alerts and SSE alerts.

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md) and the [MIT license](LICENSE). Never submit real health data in issues or tests.
