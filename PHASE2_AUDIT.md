# Phase 2 pre-launch production audit

The review was performed read-only before fixes, then repeated after the listed fixes. It covered responsive design, security, performance, error states, production readiness, and SEO/metadata. No claim below substitutes for a browser check, clinical review, independent security review, or production test.

> Review this project as a pre-launch production audit. Do not modify any files yet. First inspect the relevant code and report your findings. Check: responsive design, security, performance, error states, production readiness, and SEO/metadata. For every issue include: Severity (Critical / Important / Improvement), where it appears, why it matters, the smallest safe fix, and how I can manually verify the fix. Do not claim something is secure or working unless you can verify it from the project. Clearly mark anything that requires manual testing.

## Initial findings and fixes

| Severity | Where | Why it matters | Smallest safe fix | How to manually verify |
| --- | --- | --- | --- | --- |
| Important | `apps/web/lib/api.ts` | An expired access cookie caused `/auth/me` to redirect even when a valid refresh cookie existed | Refresh once and retry the account read | Sign in, expire the access cookie, then reload a protected page |
| Important | `apps/api/src/auth.service.ts` | Password reset revoked sessions but left a locked account unable to sign in | Clear lockout state in the reset transaction | Trigger lockout, reset password, then sign in with the new password |
| Important | `apps/api/src/request.service.ts` | An expired request could still display `OPEN` in its owner's view | Lazily mark owned stale requests `EXPIRED` before reads | Expire a request in a test database and reload list/detail; donor search must exclude it |
| Important | `apps/web/components/LocationFields.tsx`, donor/request services | Browser geolocation was stored to six decimal places while the UI called it approximate | Round to two decimals on the server and in the UI | Submit coordinates with six decimals, inspect owned profile/request values in the API |
| Improvement | `apps/web/app/dashboard/page.tsx` | Admins saw request/donor links they could not use | Show those cards only to normal users | Sign in as admin and user; compare dashboard links |
| Important | CI workflow | Ownership and role tests existed only as manual smoke scripts | Run PostGIS/Mailpit-backed integration scripts in CI | Inspect a new CI run and its integration step |

All code fixes above are in the Phase 2 source. The integration gate will be confirmed again from the remote CI run after push.

## Verification performed

- `pnpm db:generate`, TypeScript checks, Vitest tests and production build passed locally.
- Prisma migration `0002_security_mvp` applied to local PostGIS.
- `scripts/run-integration.sh` passed against local PostGIS, Mailpit and the compiled API. It covers registration, verification, refresh rotation/reuse, cookie mutation origin checks, password reset, logout, account lockout, all Phase 2 routes logged out, ordinary/admin role boundaries, request ownership, redacted matching, contact sharing after donor interest, edits, closing and donor reapproval.
- PostGIS geospatial matching was exercised with nearby coordinates and an approved donor. UI pages passed the Next.js production build.
- Manual browser checks at 320 px, desktop, landscape, 200% zoom, keyboard use, slow network and offline mode were **not performed**. No Lighthouse or production traffic measurements were performed.

## Remaining launch readiness

| Area | Ready? | Notes / fixes |
| --- | --- | --- |
| Responsive Design | Not yet | CSS wraps navigation, grids and forms; manual device and zoom checks remain. |
| Security | Not yet | Auth, role and ownership checks passed locally. Distributed rate limiting, privacy policy, data export/deletion, comprehensive consent controls, deployment secrets review and independent security review remain for Phase 3/pre-launch. |
| Performance | Not yet | PostGIS GiST indexes, result limits and query filters exist; load tests, slow network tests and Core Web Vitals remain. |
| Error States | Not yet | MVP screens have loading, empty and error feedback; offline behavior and broad form edge-case testing remain. |
| SEO and Metadata | Not yet | Basic title/description exist; canonical/social metadata, sitemap, robots, structured data and public landing content remain for Phase 5. |

Monitoring also remains incomplete: pino logs exist, while Sentry and production analytics are not configured. No production deployment was made. Blood bank inventory, queued email alerts and SSE alerts remain v2. Donor screening and red-cell compatibility logic require qualified local clinical confirmation before real-world use.
