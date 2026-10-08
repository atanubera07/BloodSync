# ADR 0003: Keep request CSP nonces

**Status:** Accepted · 2026-10-08

Next.js uses a per-request nonce on inline scripts under the current strict CSP. The root layout reads request headers so public pages render dynamically; they cannot use Next's static HTML cache. A hash-based CSP could permit static HTML, but Next's generated inline script content and deploy-specific hashes would need reliable build-time tracking. For this prototype, keep the nonce and measure the real traffic cost before changing it. Local Lighthouse performance was 97, but production cache and load behavior remain unverified.
