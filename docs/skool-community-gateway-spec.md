# Skool Community → BuildScope Visual Reader Gateway Spec

## Pilot and route

- Pilot Reader: `一棵樹個價，到底包啲乜？`
- Website route: `/read/tree-price-scope/`
- Product model: `Skool = Home；BuildScope Visual Reader = Reading Room`.
- Purpose: one Community gateway image leads readers to the complete nine-slide reader. There is no public Reader library index.

## Cover copy

```text
ENGINEERING PLAIN TALK

一棵樹個價，
到底包啲乜？

LANDSCAPE × QS

9-SLIDE VISUAL EXPLAINER

READ FULL CAROUSEL →
```

## Layout and export

- Primary Community cover: 1080 × 1080 px so the key message survives Skool's square presentation.
- Optional IG gateway version: 1080 × 1350 px.
- Keep the title, category line and CTA inside the central 80% safe area.
- Reuse the dark navy, signal yellow, white type, tree visual and BuildScope logo treatment from the existing Carousel artwork.
- The arrow is a visual CTA only. Do not imply the uploaded image is clickable unless Skool confirms that behaviour.

## Community post CTA

```text
一棵樹嘅報價，真係只係棵樹本身？

Supply、delivery、planting、support、maintenance、replacement responsibility，任何一項 scope 唔同，都可能令三份 quotation 根本唔係比較緊同一樣嘢。

👉 完整 9 張 Engineering Plain Talk：
https://buildscope-blog.com/read/tree-price-scope/

Discussion：你收到三份 Landscape quotation，第一樣通常會比較乜？
```

## Link configuration

- Put the clickable website URL in the Skool post text.
- When the real Skool discussion post exists, set `skoolDiscussionUrl` in `src/data/readers.ts` to that exact URL.
- Optionally set `skoolCommunityUrl` to the confirmed public Learning Lab URL for readers who receive a shared link.
- Until those fields are set, the website intentionally keeps the primary CTA disabled and omits the secondary CTA.
- Reader pages use `noindex, follow`. Existing site pages keep their current indexing behaviour.
