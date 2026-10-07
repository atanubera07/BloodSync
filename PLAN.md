# BloodSync rebuild plan (Phase 0)

Status: approved for Phase 1. This plan uses the reference repository only to identify behavior; no source files will be copied.

## Name and destination

**Approved name: BloodSync.** The connected GitHub account nicknamed `atanu` is `atanubera07`, and it already owns an empty public `atanubera07/BloodSync` repository. That makes the intended source destination clear. Both BloodSync and BloodLink are used by other GitHub repositories, so neither is distinctive on GitHub. npm package availability, domain availability, and trademark clearance remain unverified; do not imply exclusive rights. Use a scoped npm package name and confirm public branding before launch. The MIT license and README will credit **Atanu Bera**, as approved by the owner.

## Reference feature map

| Reference area | Rebuild behavior |
| --- | --- |
| Home, about, FAQ, contact | Accessible public pages with accurate service and safety information |
| User registration, login, profile | Verified accounts, secure sessions, private profile and consent settings |
| Donor registration and search | Eligibility screening, approval, availability, geospatial matching; no public contact details |
| Blood requests and urgent requests | Owner-scoped requests, urgency, expiry, status and fulfilment tracking |
| Blood bank registration and dashboard | Deferred to v2 |
| Admin dashboard | Server-authorized approval, moderation, audit view |
| Emergency broadcast | Deferred to v2 |
| Location and statistics | Geospatial search and privacy-safe aggregates |

The reference has root and `backend/` copies of much of the app, including duplicated frontend files. Its committed production env files and the security defects listed in the prompt are specifically excluded from the rebuild.

## Architecture and data

- pnpm workspace: `apps/web` (Next.js App Router), `apps/api` (NestJS), `packages/shared` (Zod schemas/types).
- PostgreSQL with PostGIS; Prisma for ordinary records and parameterized SQL for distance queries. Redis will back rate limiting in the MVP; queued email and SSE alerts are deferred to v2.
- Core entities: `User`, `AuthSession`, `EmailVerificationToken`, `PasswordResetToken`, `DonorProfile`, `Donation`, `BloodBank`, `BloodBankMembership`, `BloodBankInventory`, `BloodRequest`, `RequestMatch`, `ContactConsent`, `Alert`, `Notification`, and `AuditEvent`. Store exact locations and contact data privately; expose only approved, necessary fields.
- Roles are assigned by trusted server workflows: patient/donor at signup, bank staff after bank approval, admin through an operator-only provision step. A client-supplied role is never accepted.
- Request and alert jobs use an outbox/idempotency key so retries do not duplicate delivery. SSE streams authenticated in-app alerts; email delivery is queued and optional until configured.

## User flows

1. A person signs up, verifies email, signs in, and manages consent and profile data. Reset password and logout revoke relevant sessions.
2. A donor enters age, weight, donation history and location. The server screens the stated 18–65, 45 kg and 90-day rules, then an authorized reviewer approves the profile. Screening is informational and never medical clearance.
3. A patient creates a request with blood group, units, urgency, location and expiry. Matching uses compatible groups, availability, consent and distance. A donor sees an anonymized request, opts in, and only then the appropriate contact exchange occurs.
4. The request owner can close or cancel their request. Blood bank inventory and fulfilment are deferred to v2.
5. An admin approves donors, moderates requests, and reviews audit events. Emergency alerts are deferred to v2.
6. A user can export and delete their data subject to documented retention requirements. Private dashboards require a valid session and proper role.

## Planned routes

| Web | API |
| --- | --- |
| `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/faq` | `GET /health`, `POST /contact` |
| `/sign-up`, `/sign-in`, `/verify-email`, `/forgot-password`, `/reset-password` | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/password/forgot`, `/auth/password/reset` |
| `/dashboard`, `/profile`, `/profile/privacy` | `GET/PATCH /me`, `GET /me/export`, `DELETE /me`, `GET/PATCH /me/consent` |
| `/donors`, `/donor/profile`, `/donor/requests` | `GET /donors/search`, `POST/PATCH /donors/me`, `GET /donors/me/matches`, `POST /matches/:id/consent` |
| `/requests`, `/requests/new`, `/requests/[id]` | `GET/POST /requests`, `GET/PATCH/DELETE /requests/:id`, `POST /requests/:id/close` |
| Blood bank pages (v2) | Bank registration, inventory, offers and fulfilment (v2) |
| `/admin` | `GET /admin/review-queue`, `POST /admin/donors/:id/approve`, `GET /admin/audit` |
| Private alert center (v2) | Queued email and SSE endpoints (v2) |

All nonpublic routes enforce authentication, role and object ownership on the API. Public search returns redacted records. Admin paths use the same server authorization regardless of UI state.

## Phases and acceptance mapping

1. **Foundation:** workspace, strict TypeScript, validated environment, Prisma schema/migrations/seed, Argon2, short-lived access and rotating refresh cookies, email verification/reset, Zod validation, central errors, pino/Sentry, Docker Compose and CI.
2. **Core MVP:** donor screening/approval, requests and expiry, PostGIS matching, admin dashboard. Bank inventory, queued email and SSE alerts are v2. Add meaningful unit, integration and browser tests for the full journey.
3. **Security and privacy:** deny-by-default authorization, ownership tests, Redis rate limits, CSP/CORS, CSRF protection for cookie-authenticated mutations, audit events, consent gating, export/deletion and no secret or health data in logs. Recommend independent review before use with real health data.
4. **UX and performance:** responsive and accessible screens from 320px through desktop and 200% zoom; loading, success, empty, offline and error states; optimized media, pagination and indexed queries. Test mobile and desktop, slow network and Lighthouse.
5. **Metadata and SEO:** Metadata API, canonical/social metadata and images, icon/manifest, sitemap/robots, JSON-LD, useful public city/group content, `noindex` private pages, redirects and security headers. Search Console submission requires an actual verified production domain.
6. **Open source release:** MIT LICENSE, README with screenshots and setup/architecture, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates, CHANGELOG and RUNBOOK. Confirm production configuration and run end-to-end acceptance before launch.

After each implementation phase: run the app and relevant tests, perform the exact read-only audit requested in the prompt, fix Critical and Important findings, repeat the audit, and record readiness for Responsive Design, Security, Performance, Error States, and SEO and Metadata. Claims requiring a production service or independent review remain marked unverified until tested there. Make small conventional commits.

## Phase 0 audit and open decisions

There is no application code yet, so responsive behavior, security, performance, error states, production readiness and SEO cannot be verified. Important planning risks: health-related privacy, donor eligibility varying by jurisdiction, blood compatibility and medical decisions needing qualified review, and emergency alert misuse. The smallest safe response is to keep contact information private by default, require approval and explicit consent, avoid clinical eligibility claims, and obtain a professional security and medical workflow review before real-world use. Manually verify the eventual flows with separate patient, donor, bank and admin accounts and a production-like environment.

Owner approved BloodSync, `atanubera07/BloodSync`, and license author Atanu Bera. No old data needs migration.

## Eligibility configuration

MVP defaults live in `packages/shared/src/eligibility.ts`: age 18–65 years, minimum weight 45 kg, minimum gap 90 days. The 45 kg value follows the owner-confirmed donor guidance in the reference; the reference README states 50 kg, a documented conflict. These are screening rules, not medical clearance. A qualified local reviewer must confirm them before real use.

## MVP boundary

Auth, donor approval, requests, matching, and admin approval are in scope. Bank inventory, queued email, and SSE alerts are v2. No data migration is needed.
