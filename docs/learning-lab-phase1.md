# Learning Lab Phase 1

- Public routes: `/learning-lab/`, `/learning-lab/{slug}/`, `/learning-lab/{slug}/preview/`.
- Content: `src/content/courses/*.md`; frontmatter drives catalog and landing page, Markdown body is the public preview.
- CMS: `/admin` → Learning Lab 課程. Existing GitHub-backed workflow remains on `main` for production content editing after merge. `draft: true` hides a course and its preview from catalog, generated routes and sitemap.
- Categories are constrained in `src/content.config.ts` and represented in `src/data/courses.ts` and CMS options. Align all three if categories change.
- PNRC has a repository-verified Classroom URL (from `src/content/readers/pnrc-reading-guide.md`); Johnny supplied the Dewatering Classroom URL on 17 November 2026. NEC4 and AI × M365 CTAs go to the verified community URL until their Classroom URLs are supplied and confirmed.
- Skool remains responsible for membership, payment, downloads and full lessons. No duration, price or lesson count appears in the new pages.
- SEO: canonical, description, Open Graph and JSON-LD from BaseLayout; sitemap lists the nine public routes.
- GA4: existing consent-gated page views and automatic `skool_cta_click` with course ID/location/destination; `learning_lab_search` and `learning_lab_preview_open` are new consent-gated events. In GA4 DebugView, accept consent, filter catalog and open a preview, then click a Skool CTA; check the events and parameters. A click does not prove a paid join.
- QA: `npm test`, `npm run build`, `node tests/learning-lab-links.mjs`, `npm run test:assets`, and browser tests in `.github/workflows/phase1-qa.yml`.

## Production deployment

The `Deploy BuildScope Production` workflow runs on pushes to `main` and can be retried manually. It builds and checks the full checkout, then deploys the existing `buildscope-blog` Worker from `wrangler.jsonc`. Configure repository Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` before merging. Scope the token to this Cloudflare account and, where available, this Worker, with Workers Editor access. Never commit the token. Confirm the workflow succeeds and check `/learning-lab/`, all four courses and the Dewatering CTA on Production.
