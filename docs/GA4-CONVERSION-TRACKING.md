# BuildScope GA4 Conversion Tracking

## 1. Build-time environment variables

The GA4 tag is disabled when `PUBLIC_GA4_MEASUREMENT_ID` is blank or invalid.

```powershell
$env:PUBLIC_GA4_MEASUREMENT_ID='G-XXXXXXXXXX'
$env:PUBLIC_GA4_CONSENT_REQUIRED='true'
$env:PUBLIC_GA4_DEBUG_MODE='false'
npm run build
```

These are Astro build-time variables. Set them in the environment that runs the production build. The Measurement ID is public by design, but it must not be hard-coded into source files.

## 2. Consent integration

The safe default is `PUBLIC_GA4_CONSENT_REQUIRED=true`. GA4 is not loaded and campaign data is not written to browser storage until consent is granted.

The BuildScope consent panel is included when a valid Measurement ID is present. It offers accept/deny controls and a persistent **Cookie 設定** button so the visitor can change or withdraw consent later.

An external approved Cookie Consent/CMP can also call either interface:

```js
window.BuildScopeAnalytics?.setConsent("granted");
window.BuildScopeAnalytics?.setConsent("denied");
```

or:

```js
window.dispatchEvent(new CustomEvent("buildscope:analytics-consent", {
  detail: { status: "granted" },
}));
```

Do not set `PUBLIC_GA4_CONSENT_REQUIRED=false` until the owner has confirmed that analytics may load without an explicit consent action for the site's applicable audience and policy.

## 3. Campaign links

Use consistent lower-case UTM values. Examples:

- Threads: `?utm_source=threads&utm_medium=social&utm_campaign=visual_library_hvac`
- Instagram: `?utm_source=instagram&utm_medium=social&utm_campaign=visual_library_hvac`
- Facebook: `?utm_source=facebook&utm_medium=social&utm_campaign=visual_library_hvac`

After consent, the first campaign is saved in local storage and the current campaign is saved for the browser tab/session. Both are attached to BuildScope custom events as `first_utm_*` and `current_utm_*` parameters. GA4 also receives a page view with a sanitized URL; non-UTM query parameters such as Visual Library free-text searches are removed.

## 4. Events

| Event | Trigger | Important parameters |
| --- | --- | --- |
| `visual_library_open` | Visual Library page opens | campaign parameters |
| `visual_library_search` | Debounced text search, category/tag selection, clear/reset | `search_type`, `search_term_length`, `selected_category`, `selected_tag`, `result_count` |
| `carousel_slide_view` | A previously unseen slide is shown during the current page view | `topic_slug`, `slide_index`, `slide_count`, content fields |
| `carousel_complete` | The visitor actually reaches the final slide; once per page view | `topic_slug`, `slide_count`, content fields |
| `skool_cta_click` | Any link whose destination host is `skool.com` | `cta_location`, `destination_url`, `destination_type`, `topic_slug` |

Free-text search terms are intentionally not sent to GA4 because visitors could type personal information. Only the normalized character count and result count are sent.

## 5. GA4 custom definitions

In **Admin → Data display → Custom definitions**, register event-scoped custom dimensions for:

- `topic_slug`
- `content_category`
- `cta_location`
- `destination_type`
- `destination_url`
- `search_type`
- `selected_category`
- `selected_tag`
- `first_utm_source`, `first_utm_medium`, `first_utm_campaign`
- `current_utm_source`, `current_utm_medium`, `current_utm_campaign`

Register event-scoped custom metrics for `slide_index`, `slide_count`, `result_count`, and `search_term_length` if numeric reporting is required.

## 6. Recommended Explorations

### Threads traffic

Create a Free form Exploration:

- Filter: `current_utm_source` exactly matches `threads`
- Rows: `current_utm_campaign`, `Page path and screen class`
- Values: `Active users`, `Sessions`, `Event count`, `Key events`
- Optional comparison: repeat for `instagram` and `facebook`

### Visual explainer completion rate

Create a Funnel Exploration:

1. `carousel_slide_view` where `slide_index = 1`
2. `carousel_complete`

Break down by `topic_slug` and optionally `current_utm_source`. The funnel completion percentage is the explainer completion rate. This avoids using Visual Library listing visits as the denominator.

### Skool CTA click-through rate

Create a Funnel Exploration:

1. `carousel_slide_view` where `slide_index = 1`
2. `skool_cta_click`

Break down by `topic_slug`, `cta_location`, and `destination_type`. For a site-level view, compare `skool_cta_click` users with `visual_library_open` users over the same date range.

Mark `skool_cta_click` as a Key event only if a click to Skool is the agreed conversion. Do not mark slide views or searches as Key events.

## 7. DebugView checklist

Build a non-production test with a real test Web Stream ID and:

```powershell
$env:PUBLIC_GA4_DEBUG_MODE='true'
```

Then:

1. Open GA4 **Admin → Data display → DebugView**.
2. Grant consent through the approved CMP callback and confirm one `page_view`.
3. Open `/visual-library/` and confirm one `visual_library_open`.
4. Type a search and pause for at least 500 ms; confirm one `visual_library_search` and no raw search text.
5. Select a category and a tag; verify their controlled values and result counts.
6. Open a Reader and verify slide 1 once.
7. Move forward, backward, and forward again; each slide number should appear at most once per page view.
8. Stop before the final slide; verify no `carousel_complete`.
9. Reach the final slide; verify exactly one `carousel_complete`, even after navigating away and back within the carousel.
10. Click Header, Footer, Reader, PRO Course, Resource and Plans links to Skool; verify one `skool_cta_click` per click with the exact destination and location.
11. Test tagged Threads, Instagram and Facebook URLs in separate clean sessions and inspect first/current UTM parameters.
12. Deny consent and verify no request to `googletagmanager.com` and no GA4 events.
13. Check the browser console: tracking or blocker failures must not affect the page UI.

Disable `PUBLIC_GA4_DEBUG_MODE` before a production build.
