# Vercel production smoke audit — 2026-10-08

Scope: synthetic data only. Production smoke checks were run on deployment `dpl_7iAtieBM8Tt6TJTQvQQVEDbTs6yK` from commit `c89da76032a14e24810311ba2828c3dbf4da58bb`, served at `https://bloodsync-ivory.vercel.app`. This is a smoke audit, not approval for real donor or patient data.

| Check | Result | Evidence and limit |
| --- | --- | --- |
| Vercel deployment | Pass | Deployment state `READY`. |
| Public home page | Pass | HTTP 200. |
| API liveness | Pass | `/api/v1/health/live` returned HTTP 200 and `{"status":"ok"}`. |
| API readiness | Pass | `/api/v1/health/ready` returned HTTP 200 and `{"status":"ok"}` after checking Neon and Upstash. |
| Database migrations | Pass | Four production Prisma migrations applied successfully during deployment. |
| Anonymous request access | Pass | `/api/v1/requests` returned HTTP 401. |
| Anonymous admin access | Pass | `/api/v1/admin/donors` returned HTTP 401. |
| Crawler files | Pass | `/robots.txt` and `/sitemap.xml` returned HTTP 200; sitemap points to the production site. |
| Production environment | Pass with limit | Required variables are present, configuration validation passes, and no duplicate Production variable names were found. Secret values were not displayed in the audit. `DATABASE_URL` also exists in Development by design. |
| Authenticated donor, patient, and admin journeys | Unverified | No production test accounts or email verification flow were exercised. Local route ownership and role tests remain the evidence for these paths. |
| Email delivery | Unverified | Resend test sender `onboarding@resend.dev` is configured. No verified sending domain or delivered message was tested. |
| Queued email and scheduled expiry | Unverified | Deployment builds, but queue delivery and scheduled Cron execution were not observed live. |
| Performance, accessibility, backup restore, independent security review | Unverified | No production measurement or exercise was run for these areas. |

The live API initially failed to start because Vercel's Nest bundle exposed `ioredis` imports as an empty shim. Rate limiting now uses a small Redis command client, with TLS required in production, and the readiness check confirms a live Upstash connection. The focused rate limit and health tests passed locally (6 tests), along with TypeScript and ESLint checks. CI for `c89da76` passed six jobs and failed integration because its local Redis uses plain TCP. The follow-up supports plain TCP outside production; CI for that follow-up must be checked separately.

Keep production limited to synthetic data until a sender domain is verified, a complete authenticated flow is exercised, and the remaining operational checks are completed.
