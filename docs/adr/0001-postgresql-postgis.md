# ADR 0001: PostgreSQL and PostGIS

**Status:** Accepted · 2026-10-08

Use PostgreSQL for transactional account, consent and request data, with PostGIS geography functions for distance matching. This keeps approval, ownership and consent updates atomic while calculating a 50 km radius in the database. The same-city fallback covers profiles without coordinates. Operating PostGIS adds deployment work; the migration and integration tests require a PostGIS image.
