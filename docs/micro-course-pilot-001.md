# BuildScope 100 #001 pilot — release gate

## Source and publication

The Skool course redirects unauthenticated browser access to the private group's About page. The supplied sequence is implemented, but the full titles for Lesson 02, 03, 06 and Case Study require verification. All lesson text, videos, images and the Resource downloads are missing. Request the course export, complete titles and approved media from the owner. Do not mark a `lesson_content` row published until editorial review. Plain-text lesson content lives in D1 and is returned only after server authorization; no paid files belong in `public/` or `dist/`. For downloadable media, add a private R2 binding and a Worker download endpoint that checks the same entitlement before streaming.

## Test infrastructure setup

1. Create a separate Cloudflare **test** D1 database; replace `REPLACE_WITH_TEST_D1_ID` in `wrangler.jsonc` only on this branch after the ID is available. Apply `migrations/0001_learning.sql` to that database. Existing production D1 data must not be reused.
2. Add Worker secrets `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, and a random `LEARNING_ADMIN_TOKEN`. Configure `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` from recurring test Prices only, after reviewing the proposed prices. No amount is coded into the site. Verify the portal configuration in Stripe Test Mode.
3. Register `/api/learn/stripe/webhook` as the test endpoint. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`. Delivery is signature checked against raw body and a five-minute timestamp tolerance. Replay and status reconciliation are recorded in D1. Checkout return alone never grants access.
4. Run the Worker on a preview or isolated test environment, with a separate origin and test D1 binding. `npm run build`, `npm test`, `npm run test:assets` and mobile/desktop QA. This PR has no deployment. Do not deploy the placeholder D1 ID to production.

## Test flow

Register an account with a unique test email and 12+ character password; log out and back in. An unauthenticated lesson request returns 401, an unentitled member gets 403, and unpublished content returns 404 even with entitlement. Select a test recurring Price only after configuration, complete Stripe test Checkout, wait for the signed webhook, then check `/api/learn/me`. Test duplicate delivery, cancellation at period end, immediate cancellation, expiry, renewal, and the billing portal. Verify mobile lesson navigation and no regressions in Blog, Reader and Tools. Progress can only be marked for a published lesson; it is stored by member and course in D1.

## Skool migration

Keep all Skool billing untouched. Existing paid Skool members register a separate website account. An administrator manually verifies active Skool billing in Skool before granting access, retaining an internal verification reference and expiry/revocation plan. Admin calls `/api/learn/admin/grant` with its own logged-in website account, an `Authorization: Bearer` token and JSON `{ "memberId": "<website member UUID>", "skoolReference": "<verified record reference>" }`. This endpoint never reads or modifies Skool. A later reconciliation process must revoke grants when Skool eligibility ends; do not infer that Stripe and Skool statuses sync. Website account emails are not verified by this pilot, so admin must check account ownership out of band before granting. Add email verification and password reset before public enrolment.

## Release blockers

- Source materials and full lesson titles have not been supplied or verified.
- Test D1, test Stripe account/Prices/webhook secrets and preview deployment are not configured.
- Email verification, password reset and abuse protection beyond per-account lockout are required for public registration.
- Private media delivery and admin grant revocation interface are required before publishing paid lessons.
- Test checkout, webhook end-to-end, desktop/mobile screenshots, and production regression remain to be verified on a preview.

**Recommendation: No-Go for production.** Review the code and course shell in this PR; keep the feature branch isolated until the gates above are met.
