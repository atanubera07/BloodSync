## 2026-03-30 - Buffer byte-length checks for timingSafeEqual
**Vulnerability:** Node's `crypto.timingSafeEqual` throws an unhandled `RangeError`/`TypeError` when passed buffers of different byte lengths, causing a 500 server error DoS when CSRF tokens with multi-byte UTF-8 characters are provided.
**Learning:** Checking string length (`cookie.length !== header.length`) only checks UTF-16 code units. Multi-byte characters match string length but result in differing buffer byte lengths.
**Prevention:** Convert strings to `Buffer` and compare `bufA.length !== bufB.length` before invoking `timingSafeEqual`.
