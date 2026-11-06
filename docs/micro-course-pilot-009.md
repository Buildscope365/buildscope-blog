# BuildScope 100 #009 — Dewatering course pilot

## Scope and content handling

The author supplied six complete text lessons, course positioning, learning path and a proposed 10-point resource in the conversation. A seven-unit editorial JSON draft and an unpublished SQL import file have been prepared separately in private file storage; neither is in Git. The repository is public, so the paid text is deliberately **not** committed to source, `public/` or `dist/`. The Worker reads published lesson text from the private `lesson_content` D1 table and enforces session and entitlement checks before returning it. This branch contains the exact nine-unit outline and public landing description. No lesson is falsely marked published. Review the private editorial JSON against the supplied course text. After approval, use `node scripts/prepare-learning-import.mjs /absolute/private/source.json /absolute/private/output.sql` and apply the resulting SQL to a **test D1** database. The generated SQL leaves every lesson `published=0`; after content QA and entitlement testing, set the positioning and six lessons to `published=1` through a reviewed administrative migration. Re-running the import resets those seven to unpublished. Never commit the private JSON or SQL. The suggested checklist is not a supplied finished download and stays labelled `待製作`.

The linked `images.openai.com/static-rsc-4` images appear to derive from third-party sites and have no supplied reuse rights. They are excluded. The owner-supplied course cover is public; the six owner-supplied lesson artboards are prepared for private R2, served through a Worker endpoint after entitlement checks. Do not place paid images or PDFs in public static assets.

## Technical review

- The user's distinction between surface water and groundwater control, and the need to monitor head/pore pressure rather than pump operation alone, is consistent with GEO Geoguide 1 and 2.
- Lowering groundwater can increase effective stress and contribute to consolidation settlement; it does not prove a particular observed movement was caused by pumping. GEO Publication No. 1/2023 gives a Hong Kong deep-excavation case involving confined aquifer pressure and settlement.
- Piping/boiling, hydraulic uplift and soft-clay base heave have different mechanisms. Avoid presenting all as one failure mode. Stop dangerous work and refer suspected instability to the responsible engineer and approved emergency procedure.
- Claims or EOT depend on the contract and records; the course makes no automatic entitlement assertion.

References: [CEDD Geoguide 1](https://www.cedd.gov.hk/filemanager/eng/content_106/eg1_20200601.pdf), [CEDD Geoguide 2](https://www.cedd.gov.hk/filemanager/eng/content_108/eg2_20171218.pdf), [GEO Deep Excavation Design and Construction](https://www.cedd.gov.hk/filemanager/eng/content_1024/ep1_2023.pdf), [BD APP-22 listing](https://www.bd.gov.hk/en/resources/codes-and-references/practice-notes-and-circular-letters/index_pnap.html).

## Test configuration

1. Create a separate test D1 database and replace `REPLACE_WITH_TEST_D1_ID` in `wrangler.jsonc` with its actual binding ID in a preview environment. Apply `migrations/0001_learning.sql`.
2. Create a private test R2 bucket `buildscope-learning-media-test`, keep public bucket access disabled, and upload the six owner-supplied lesson WebPs to `dewatering/lesson-1.webp` through `dewatering/lesson-6.webp`. Bind it as `LEARNING_MEDIA`. The public course cover remains under `public/`.
3. Configure verified Brevo sender `LEARNING_EMAIL_FROM`, secret `BREVO_API_KEY` and a random `LEARNING_ADMIN_TOKEN`. Registration is disabled until email delivery works. Test registration, verification link, resend, password reset, session invalidation after reset and an admin grant only after email verification. Tokens expire after one hour; token links live in the URL fragment and are submitted by same-origin POST.
4. Configure Worker secrets `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`. Provide monthly and annual recurring test Price IDs (`STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`) only after prices are approved. No real price or live key is in code.
5. Configure a test webhook for `checkout.session.completed` and `customer.subscription.created/updated/deleted`, then verify test checkout, renewal, cancellation, billing portal, duplicate event delivery and expiry. Checkout remains blocked until the positioning and six lessons are published. Signed Checkout events must match a Checkout Session created by this Worker, and only that session's configured test Price may grant subscription entitlement. Out-of-order subscription events are retried until Checkout association exists.
6. Test public/unauthenticated lesson 401, logged-in unentitled 403, entitled unpublished 404, and entitlement to published D1 content. Verify progression persists and resources are not on static URLs. Check desktop and 390 px mobile navigation, Blog/Reader/Tools regressions.

## Existing Skool members

Leave Skool billing intact. Members register a website account and verify the email link, then request manual eligibility verification. The administrator must verify paid Skool status and account ownership out of band before calling `/api/learn/admin/grant` with the registered member ID and a verification reference. This endpoint accepts an administrator Bearer token from a server-side script without a member cookie; browser requests with a foreign Origin are rejected. A repeated grant with the same reference is idempotent; `/api/learn/admin/revoke` revokes the matching reference without changing Stripe or Skool. Keep the token in a Worker secret and a local administrator environment variable, never in a web page or command history. Grants are separate from Stripe status. A recurring review workflow is required before release. The email flow is prepared but cannot be exercised end to end until a verified sender and test Brevo key are configured.

## Release decision

**No-Go for production.** The approved private content import, private lesson media upload, proposed resource download, test D1/R2, test Stripe configuration, live email delivery, end-to-end billing verification and a bound Worker preview remain to be done. Static landing desktop/mobile screenshots are captured in [GitHub Actions run #36](https://github.com/Buildscope365/buildscope-blog/actions/runs/42204171451). Keep this PR unmerged and do not deploy it to production.

## Artwork supplied after initial PR

The owner supplied seven 16:9 PNGs in sequence: Lesson 1–6 and course cover. The cover is optimized to WebP and stored in public static assets; the six lesson artboards contain member teaching points and are kept in a separate private media bundle, outside Git. After provisioning the test `LEARNING_MEDIA` R2 binding, upload files to exact object keys `dewatering/lesson-1.webp` through `dewatering/lesson-6.webp`. The Worker media route verifies a logged-in member, current entitlement and published lesson before streaming. No public R2 URL or public bucket access should be enabled. The artwork is not a substitute for the private lesson text import.

The course progress meter counts the six actual lessons. Course Completion unlocks only after those six published lessons are marked complete by an entitled member; its summary and #010 learning path are served privately. The proposed Resource remains visibly unready and cannot be marked complete, so a missing PDF never inflates progress or blocks the six-lesson completion state.

Image QA: all are 1536 px wide; six are 864 px high and Lesson 4 is 865 px high. Verify legibility at a 390 px viewport. Lesson 5 groups Boiling / Base Heave in a short bullet, while the supplied lesson text distinguishes soft-clay shear heave from seepage/uplift; editorial review should refine that label before publication. The six cover files and their SHA-256 manifest are available as a private transfer bundle; the public cover alone is committed to the PR.

## Local integration QA (6 November 2026)

The Cloudflare CLI applied all nine schema statements to an isolated local D1 database and imported the private course SQL: seven units present, zero published. Lesson 1 WebP uploaded to an isolated local R2 bucket. The direct Worker route test passes access transitions: anonymous 401, authenticated without entitlement 403, entitled but unpublished 404, entitled and published 200 with `private, no-store`, and revoked entitlement 403 without another R2 read. It uses a D1/R2 test double; it is not a live Worker integration test.

`wrangler dev --local` could not start in this executor: `uv_interface_addresses returned Unknown system error 1`, including with explicit loopback IP. GitHub Actions run #36 used an Astro static preview and Chromium to verify desktop 1440×900 and mobile 390×844 landing image, nine-unit navigation and horizontal overflow, and captured both viewport screenshots in the [screenshots artifact](https://github.com/Buildscope365/buildscope-blog/actions/runs/42204171451/artifacts/13496170737). This confirms static UI only; a bound Worker preview is still needed for private content and billing end-to-end QA.
