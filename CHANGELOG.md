# Changelog

All notable changes to BloodSync are documented here. Versions follow Keep a Changelog and semantic versioning.

## [Unreleased]

### Added

- Testing Library form and error-state tests, axe accessibility checks, and an API coverage report with CI thresholds.

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
