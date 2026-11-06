# Editorial QA — Government land release / Site Possession

Research and review: 2026-11-07 (Hong Kong). Status: **REVISE pending desktop/mobile browser inspection and human contractual review**. This is a PR-only delivery, not authorization to merge or deploy.

## Fact-check register

| Claim | Primary source | Result / boundary |
| --- | --- | --- |
| Yuen Long South Phase 2 Contract 6 F1–F4 announcement, 2026-09-25; four framework contractors, Job Requests, first batch expected to commence Q1 2027 | [Government press release](https://www.info.gov.hk/gia/general/202609/25/P2026092500218.htm); [CEDD tender](https://www.cedd.gov.hk/tc/tender-notices/contracts/tender-notices/index-id-2440.html) | Verified. Neither source specifies a contractual Site Access Date. “2027 handover” is a misleading paraphrase and is explicitly corrected in the article. |
| NEC4 ECC standard 33.1 and 60.1(2) | [NEC official enforcement clauses explainer](https://www.neccontract.com/news/do-what-nec4-ecc-says-or-face-the-%E2%80%98enforcement-clauses%E2%80%99); [Access date FAQ](https://www.neccontract.com/support/faqs/deciding-the-access-date) | Verified as NEC's account of the unamended standard mechanism: the later of the part's Access Date and date shown on Accepted Programme. Actual project amendments not reviewed. |
| Starting Date, Access Date, Planned Completion, Completion Date differ; programme acceptance does not itself change Completion Date | [NEC Access FAQ](https://www.neccontract.com/support/faqs/deciding-the-access-date); [NEC correct programme FAQ](https://www.neccontract.com/support/faqs/using-the-correct-programme) | Qualified: standard NEC explanation; individual contract may amend these terms. |
| CE notification, programme changes, time and cost assessment are distinct | [NEC enforcement clauses explainer](https://www.neccontract.com/news/do-what-nec4-ecc-says-or-face-the-%E2%80%98enforcement-clauses%E2%80%99); [NEC correct programme FAQ](https://www.neccontract.com/support/faqs/using-the-correct-programme) | Verified as general NEC4 framework. No project-specific entitlement or amount asserted. |
| A/B zones, third-party interface and hypothetical impacts | BuildScope teaching hypothesis | Clearly marked hypothetical; no project dates, cost or contract terms invented. |

The actual F1–F4 NEC edition, Hong Kong amendments, ACC, Z clauses, Contract Data, Scope and Job Requests were not provided. This article does **not** decide entitlement under those contracts. Human contractual review of that boundary remains a publication gate.

## Image QA

| File | Pixels / bytes | Placement | Caption and alt | Result |
| --- | --- | --- | --- | --- |
| `hero.webp` | 1400×790 / 134,350 | Article cover | Existing generated construction context image, recompressed; caption and alt expressly say not actual site | GO |
| `logic.png` | 1400×900 / 32,386 | After official-announcement section | In article; later-of rule and separate event/time/cost boxes | GO |
| `scenario.png` | 1400×900 / 24,282 | After hypothetical interface-delay section | In article; no fictional dates or entitlement amounts | GO |
| `checklist.png` | 1200×1500 / 35,830 | Before practical evidence list | Existing seven-point checklist, palette optimized; article groups these into five workflow steps | GO |

The previously generated hero and checklist were inspected and retained. The previous logic and scenario graphics did not show the NEC4 later-of rule or separate time/cost assessment sufficiently; they were rebuilt and checked. All four were inspected at native size for Traditional Chinese, arrow direction, dimensions, contrast and text bounds. On small screens, the body supplies the same information in HTML text and a table. A live mobile browser check remains open.

## Website and SEO

Content file: `src/content/blog/government-land-release-site-possession-date.md`. Slug follows filename. Existing blog template generates canonical URL, Article JSON-LD, publication and review metadata, source list, related readers/articles, and the general paid Learning Lab CTA. No course URL is claimed. No existing Reader or tool assets changed.

Production build and Astro validation: pass, 60 pages, 0 diagnostics. Reader asset test: 36 Reader entries, 334 images and ordering pass. New article local image/link and metadata checks: pass after replacement of two draft-only article links. Browser visual regression: **not run** because the local Playwright Chromium download was unavailable; inspect desktop and mobile before marking publish GO.
