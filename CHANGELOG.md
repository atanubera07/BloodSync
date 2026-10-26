# Changelog

All notable changes to BloodSync are documented here. Versions follow Keep a Changelog and semantic versioning.

## [Unreleased]

### Added

- Testing Library form and error-state tests, axe accessibility checks, and an API coverage report with CI thresholds.

### Fixed

- Donor consent controls and dashboard guidance stay consistent after withdrawal; profile edits, consent changes, and interest creation are serialized.
- Password resets invalidate outstanding reset links, and unverified users receive actionable sign-in guidance.
- Authentication limits apply across rotating email addresses; security audit events work with the deployed API prefix.
- Request owners no longer appear in their own donor matches. Request closure, deletion, and connection failures have accurate feedback.
- Browser checks use precise control selectors and application readiness checks. See the [2026-10-26 product review](docs/PRODUCT_REVIEW_2026-10-26.md) for verification evidence.

### Security

- Patched reported vulnerabilities in Next.js, Zod, Nodemailer, Vitest, request parsers, and HTTP dependencies within their existing major versions.
- Enforced the 64 KB JSON limit, prevented API response caching, and made malformed CSRF comparisons return a denial safely.

## [0.3.0] - 2026-10-08

### Added

- Versioned API and OpenAPI documentation, process and dependency health endpoints, and Docker health checks.
- TypeScript integration tests, matching and policy tests, browser journey checks, split CI jobs, and CodeQL analysis.
- Contributor, security, architecture decision, and audit documentation.

### Changed

- Auth uses separate derived keys, generic login failures, limited user selection, and queued account emails.
- Production containers use staged builds and a non-root runtime.
- Web navigation, loading and error states, request detail behavior, and internal links were improved.

### Fixed

- Signup succeeds after account creation if the email queue is unavailable; users can request verification again.
- Production startup requires explicit site and mail configuration.
- Request details remain visible if the matching service fails.

## [0.2.0] - 2026-10-07

### Added

- Donor profiles and approval, patient requests, matching, and admin review.
- Security and privacy controls, responsive and browser checks, public metadata, and repository documentation in Phases 3 through 6.

## [0.1.0] - 2026-10-07

### Added

- Authentication, verification, reset, sessions, database, and web shell.
