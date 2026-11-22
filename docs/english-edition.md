# BuildScope English — editorial and release guide

## Independence

The English site lives under `/en/` and uses `EnglishLayout`, English components and three dedicated content collections. Chinese layouts, URLs and content files are unchanged. Do not link either edition from the other. Do not add automatic language redirects. Only add `hreflang` for confirmed one-to-one translations.

## Adding a Pocket Guide or eBook

1. Sign in to the existing `/admin/` GitHub-backed CMS, choose **English / Products**, and create a new entry. CMS currently saves to `main`; for pre-release review, create or edit Markdown on a feature branch and submit a PR instead. The CMS backend branch can be changed deliberately later if a new editorial process is approved.
2. Set a unique product ID and URL slug, language `en-GB`, type `pocket-guide` or `ebook`, category, real description and optional verified cover image with alt text. Put English covers in `/images/uploads/` using the CMS image picker.
3. Leave `status: draft` until the item is approved. A published item requires a real publication date. Enter price and three-letter ISO currency only once confirmed. Enter a Gumroad URL only after verifying the actual product page. Preview URL must point to an existing local page.
4. Set `status: published` and save. The site builds a detail page at `/en/pocket-library/<slug>/` or `/en/ebooks/<slug>/`; it appears in the correct index, home section and sitemap. Build and review before merging to `main`.
5. Preserve slugs after publication to avoid breaking inbound links. To remove a listing, return the item to draft; arrange a redirect if the old page has already been indexed.

English articles use **English / Engineering Insights**; illustrations may be uploaded as cover images with alt text and embedded in Markdown. Free resources use **English / Free Resources**. Optional `downloadUrl` must be an actual file under `/en/` before publishing. The CMS's existing Chinese collections remain separate.

## SEO

English pages set `lang=en-GB`, unique titles and descriptions, canonical URLs, `og:locale=en_GB`, Open Graph images, WebSite/Article/Book and BreadcrumbList structured data, and published-only sitemap entries. Draft products, articles and resources have no public detail pages. The original Chinese layout and sitemap entries remain in place. The line illustration is an original local SVG; replace with rights-cleared photography when available.

## Analytics

The existing consent gate and GA4 ID are reused. English `page_view` has `site_edition=english`; additional events: `english_page_view`, `english_pocket_library_view`, `english_product_view`, `english_gumroad_click`, `english_resource_download`, and `english_newsletter_signup`. Use GA4 comparisons with `site_edition=english` and a page path prefix `/en/`. For English Instagram links, add `utm_source=instagram&utm_medium=social&utm_campaign=<name>` and segment by page path. Events depend on analytics consent. Resource download events only fire when a real `downloadUrl` is present.

## Dedicated English newsletter

The public signup form is off by default, so no emails are collected before setup. Create a separate English list and an active double opt-in email template in Brevo; ensure the template has its confirmation link. Set Worker secrets `BREVO_EN_API_KEY`, `BREVO_EN_LIST_ID` and `BREVO_EN_DOI_TEMPLATE_ID` in Cloudflare, never `PUBLIC_` variables. Verify API and double opt-in on a preview domain with an authorised test address. Then set `PUBLIC_EN_NEWSLETTER_ENABLED=true` at build time and deploy. The Worker `/api/en/newsletter` endpoint adds only to the configured English list using Brevo's double opt-in API. The public form's enabled state must match server configuration; a 503 returns a safe error. This setup does not automatically email contacts on new site content; a separately approved campaign or workflow would be needed. Avoid exposing Brevo keys in source or frontend variables.

## Rollback

Do not merge this feature branch until approved. To roll back after release, revert the merge commit on `main` and let the existing production GitHub Action rebuild and deploy. If a revert is not possible immediately, restore the previous successful Cloudflare Worker version. Export any newly entered English CMS content before removing the collections. Existing Chinese URL paths and content were never renamed.

## Preview

The repository's PR workflow runs browser QA locally and uploads screenshots; it does not provision a Cloudflare Preview URL. A preview requires a separately configured Cloudflare preview environment and deployment credentials. Do not use the production Wrangler project name for a preview deployment.
