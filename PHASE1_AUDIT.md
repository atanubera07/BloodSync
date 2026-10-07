# Phase 1 production audit

Review performed against the foundation source before the final fixes. Scope: responsive design, security, performance, error states, production readiness, and SEO/metadata. The full pre-launch checklist remains a later-phase gate.

## Initial findings (read-only review)

| Severity | Where | Why it matters | Smallest safe fix | Manual verification |
| --- | --- | --- | --- | --- |
| Important | Shared package `main` | Production API loaded raw TypeScript and failed at startup | Compile shared package to JavaScript and point `main` to `dist` | Run the compiled API and request `/health` |
| Important | API bootstrap | Nest `ValidationPipe` required an uninstalled package and stopped the API | Remove unused pipe; auth uses explicit Zod schemas | Run compiled API |
| Important | Server config | Production accepted HTTP origin and example session secret | Enforce HTTPS origin and reject example secret in production | Start with invalid production settings and check startup fails |
| Important | Account creation | Concurrent duplicate email could surface as a 500 | Convert Prisma uniqueness error to safe 400 | Register same email concurrently |
| Important | Auth limiter | In-memory map could grow without bound | Prune expired entries and cap map size | Load test with distinct client addresses; inspect memory |
| Improvement | Auth responses | Successful POST actions returned 201 by default | Set 200 for non-creation actions | Inspect response codes in account flow |
| Important | Database/email integration | No live migration or SMTP test at first review | Start local PostGIS/Mailpit and run account smoke flow | Repeat `scripts/smoke-auth.py` after migration |

## Fixes and evidence

- Shared package now emits CommonJS and the compiled API started successfully. `GET /health` returned HTTP 200.
- The unused validation pipe was removed. Signup/login inputs still use strict Zod validation. Production configuration now rejects insecure origin/example secret.
- Duplicate email errors and limiter memory growth have bounded, generic handling.
- Prisma schema validation and `0001_init` migration passed against local PostGIS.
- Unit tests passed for donor thresholds, role injection, invalid tokens, and admin role guard. The local smoke script passed registration → verification → login → private account → reset with session revocation → login → logout using Mailpit.
- Web and API production builds and TypeScript checks passed. Automated visual, accessibility, slow-network, and Lighthouse checks were not run.

## Remaining review by area

| Area | Ready? | Notes / fixes |
| --- | --- | --- |
| Responsive Design | Not yet | Basic responsive layout exists; device and 200% zoom QA is Phase 4. |
| Security | Not yet | Foundation auth works locally; distributed rate limiting, full object authorization, consent/data deletion, independent security review and production secrets remain. |
| Performance | Not yet | No real traffic, geo queries, or Lighthouse measurements yet. |
| Error States | Not yet | Auth form errors exist; later feature screens and offline states do not exist. |
| SEO and Metadata | Not yet | Basic title/description exist; full metadata and public pages are Phase 5. |

No production-readiness claim is made. Phase 2 MVP work remains: donor profile and approval, patient requests, matching, and admin approval UI/API. Bank inventory, queued email, and SSE alerts are v2. A qualified local clinician must approve screening thresholds before real use.
