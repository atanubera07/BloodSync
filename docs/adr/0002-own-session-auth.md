# ADR 0002: Application-owned session auth

**Status:** Accepted · 2026-10-08

BloodSync stores hashed refresh tokens in PostgreSQL and rotates them on use. Short-lived signed access cookies reference a session and the guard verifies the live session and role for each request. This permits immediate revocation and role changes without a third-party identity dependency. The application must maintain password, reset, CSRF and lockout controls and should obtain independent review before real use. Separate HKDF keys sign tokens and hash audit IPs.
