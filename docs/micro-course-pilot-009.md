# BuildScope 100 #009 — Dewatering course pilot

## Scope and content handling

The author supplied six complete text lessons, course positioning, learning path and a proposed 10-point resource in the conversation. A seven-unit editorial JSON draft and an unpublished SQL import file have been prepared separately in private file storage; neither is in Git. The repository is public, so the paid text is deliberately **not** committed to source, `public/` or `dist/`. The Worker reads published lesson text from the private `lesson_content` D1 table and enforces session and entitlement checks before returning it. This branch contains the exact nine-unit outline and public landing description. No lesson is falsely marked published. Review the private editorial JSON against the supplied course text. After approval, use `node scripts/prepare-learning-import.mjs /absolute/private/source.json /absolute/private/output.sql` and apply the resulting SQL to a **test D1** database. The generated SQL leaves every lesson `published=0`; after content QA and entitlement testing, set the positioning and six lessons to `published=1` through a reviewed administrative migration. Re-running the import resets those seven to unpublished. Never commit the private JSON or SQL. The suggested checklist is not a supplied finished download and stays labelled `待製作`.

The linked `images.openai.com/static-rsc-4` images appear to derive from third-party sites and have no supplied reuse rights. They are excluded. The course cover uses an original CSS groundwater diagram. Source-approved images can later be stored in private R2, served through a Worker endpoint after entitlement checks. Do not place paid images or PDFs in public static assets.

## Technical review

- The user's distinction between surface water and groundwater control, and the need to monitor head/pore pressure rather than pump operation alone, is consistent with GEO Geoguide 1 and 2.
- Lowering groundwater can increase effective stress and contribute to consolidation settlement; it does not prove a particular observed movement was caused by pumping. GEO Publication No. 1/2023 gives a Hong Kong deep-excavation case involving confined aquifer pressure and settlement.
- Piping/boiling, hydraulic uplift and soft-clay base heave have different mechanisms. Avoid presenting all as one failure mode. Stop dangerous work and refer suspected instability to the responsible engineer and approved emergency procedure.
- Claims or EOT depend on the contract and records; the course makes no automatic entitlement assertion.

References: [CEDD Geoguide 1](https://www.cedd.gov.hk/filemanager/eng/content_106/eg1_20200601.pdf), [CEDD Geoguide 2](https://www.cedd.gov.hk/filemanager/eng/content_108/eg2_20171218.pdf), [GEO Deep Excavation Design and Construction](https://www.cedd.gov.hk/filemanager/eng/content_1024/ep1_2023.pdf), [BD APP-22 listing](https://www.bd.gov.hk/en/resources/codes-and-references/practice-notes-and-circular-letters/index_pnap.html).

## Test configuration

1. Create a separate test D1 database and replace `REPLACE_WITH_TEST_D1_ID` in `wrangler.jsonc` with its actual binding ID in a preview environment. Apply `migrations/0001_learning.sql`.
2. Configure Worker secrets `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, and a random `LEARNING_ADMIN_TOKEN`. Provide monthly and annual recurring test Price IDs only after prices are approved. No real price or live key is in code.
3. Configure a test webhook for `checkout.session.completed` and `customer.subscription.created/updated/deleted`, then verify test checkout, renewal, cancellation, billing portal, duplicate event delivery and expiry. Checkout remains blocked until the positioning and six lessons are published. Signed Checkout events must match a Checkout Session created by this Worker, and only the configured monthly or annual test Price may grant subscription entitlement.
4. Test public/unauthenticated lesson 401, logged-in unentitled 403, entitled unpublished 404, and entitlement to published D1 content. Verify progression persists and resources are not on static URLs. Check desktop and 390 px mobile navigation, Blog/Reader/Tools regressions.

## Existing Skool members

Leave Skool billing intact. Members register a website account and request manual eligibility verification. The administrator must verify paid status and account ownership out of band before calling `/api/learn/admin/grant` with the registered member ID and a verification reference. Grants are separate from Stripe status. A recurring review/revocation workflow is required before release. The current pilot does not send mail, verify account email or provide password reset; public enrolment must wait for these safeguards.

## Release decision

**No-Go for production.** The approved private content import, lesson images and download, test D1, test Stripe configuration, email ownership flow, end-to-end billing verification, screenshots and preview remain to be done. Keep this PR unmerged and do not deploy it to production.

## Artwork supplied after initial PR

The owner supplied seven 16:9 PNGs in sequence: Lesson 1–6 and course cover. The cover is optimized to WebP and stored in public static assets; the six lesson artboards contain member teaching points and are kept in a separate private media bundle, outside Git. After provisioning the test `LEARNING_MEDIA` R2 binding, upload files to exact object keys `dewatering/lesson-1.webp` through `dewatering/lesson-6.webp`. The Worker media route verifies a logged-in member, current entitlement and published lesson before streaming. No public R2 URL or public bucket access should be enabled. The artwork is not a substitute for the private lesson text import.

Image QA: all are 1536 px wide; six are 864 px high and Lesson 4 is 865 px high. Verify legibility at a 390 px viewport. Lesson 5 groups Boiling / Base Heave in a short bullet, while the supplied lesson text distinguishes soft-clay shear heave from seepage/uplift; editorial review should refine that label before publication. The six cover files and their SHA-256 manifest are available as a private transfer bundle; the public cover alone is committed to the PR.
