import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArticleJsonLd } from "../src/data/articleSeo.ts";

const site = "https://buildscope-blog.com/";
const canonical = `${site}blog/example/`;
const base = {
  title: "示例標題",
  description: "示例摘要",
  date: new Date("2026-08-01T00:00:00.000Z"),
  author: "BuildScope 編輯部",
  authorType: "Organization" as const,
  sources: [],
};

test("editorial author, published date and canonical are accurate", () => {
  const article = buildArticleJsonLd(base, canonical, site);
  assert.deepEqual(article.author, { "@type": "Organization", name: "BuildScope 編輯部" });
  assert.deepEqual(article.mainEntityOfPage, { "@type": "WebPage", "@id": canonical });
  assert.equal(article.datePublished, "2026-08-01T00:00:00.000Z");
  assert.equal("dateModified" in article, false);
  assert.equal("citation" in article, false);
  assert.equal("image" in article, false);
});

test("explicit person, factual modification date, cover and citations", () => {
  const article = buildArticleJsonLd({
    ...base,
    author: "示例作者",
    authorType: "Person",
    updatedDate: new Date("2026-09-01T00:00:00.000Z"),
    coverImage: "/images/uploads/example.jpg",
    sources: [{ name: "示例資料", url: "https://example.org/source" }],
  }, canonical, site);
  assert.deepEqual(article.author, { "@type": "Person", name: "示例作者" });
  assert.equal(article.dateModified, "2026-09-01T00:00:00.000Z");
  assert.equal(article.image, "https://buildscope-blog.com/images/uploads/example.jpg");
  assert.deepEqual(article.citation, [{ "@type": "CreativeWork", name: "示例資料", url: "https://example.org/source" }]);
});

test("rejects a modification earlier than publication", () => {
  assert.throws(() => buildArticleJsonLd({ ...base, updatedDate: new Date("2026-07-31") }, canonical, site), RangeError);
});
