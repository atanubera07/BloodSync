# Phase 5 metadata and SEO audit

The production build includes a Metadata API title template, public descriptions/canonicals, social image, icon, manifest, sitemap, robots rules, FAQ and organization/website JSON-LD, and noindex for auth and private routes. Public pages were checked in a local Chromium production build. Search engine rendering, a verified domain and submissions are unverified.

| Severity    | Where                              | Why it matters                                                                                    | Smallest safe fix and result                                                                                           | Manual verification                                                              |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Important   | Public content                     | Sitemap listed nonexistent pages during implementation                                            | Added actual About, FAQ and Contact pages and checked routes in Chromium.                                              | Open every sitemap URL and verify a 200 response.                                |
| Important   | Private pages                      | Account, donor, request and admin pages could be indexed                                          | Added noindex route layouts and robots disallow rules.                                                                 | Inspect rendered heads and fetch `robots.txt`.                                   |
| Improvement | Lighthouse description             | Next 15 streams Metadata API description outside initial head for a generic Lighthouse user agent | Metadata is present in full HTML, but Lighthouse SEO remains 91. Search bot output needs verification before indexing. | Fetch page as Googlebot and run Search Console URL inspection on a real domain.  |
| Important   | Canonical domain                   | No verified production domain exists                                                              | `SITE_URL` is configurable; CI uses an invalid example domain. Deployment must use the real HTTPS origin.              | Inspect canonical URLs on production and submit verified sitemap to Google/Bing. |
| Improvement | City and blood-group landing pages | Useful local content needs verified local medical/location facts                                  | Deferred to a qualified local content review; no thin pages or donor records were published.                           | Review local content with a clinician and search specialist before indexing.     |

One local mobile Lighthouse home run: Performance 97, Accessibility 100, Best Practices 100, SEO 91. No claim of target SEO 100 or production Core Web Vitals is made.

| Area              | Ready?  | Notes / fixes                                                                                         |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| Responsive Design | Not yet | Protected device checks remain.                                                                       |
| Security          | Not yet | Production and independent review remain.                                                             |
| Performance       | Not yet | Real-user metrics remain.                                                                             |
| Error States      | Not yet | Full offline/slow-network check remains.                                                              |
| SEO and Metadata  | Not yet | Real domain, bot rendering, city/group content and Search Console/Bing submissions remain unverified. |
