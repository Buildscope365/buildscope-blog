import type { APIRoute } from "astro";
import { getReaders } from "../data/readers";

const SITE_URL = "https://buildscope-blog.com";
const FEED_URL = `${SITE_URL}/rss.xml`;

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const wrapCdata = (value: string) =>
  `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

const toRfc822Date = (date: string) =>
  new Date(`${date}T00:00:00+08:00`).toUTCString();

const getImageMimeType = (url: string) => {
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "svg") return "image/svg+xml";
  return "image/png";
};

export const GET: APIRoute = async () => {
  const readers = await getReaders();
  const latestDate = readers[0]?.publishedDate ?? "2026-01-01";

  const items = readers
    .map((reader) => {
      const itemUrl = `${SITE_URL}/read/${reader.slug}/`;
      const coverUrl = new URL(reader.slides[0].src, SITE_URL).toString();
      const description = [
        `<p><img src="${escapeXml(coverUrl)}" alt="${escapeXml(reader.title)}" /></p>`,
        `<p>${escapeXml(reader.introduction)}</p>`,
        `<p><a href="${escapeXml(itemUrl)}">閱讀完整工程圖解</a></p>`,
      ].join("");

      return `    <item>
      <title>${escapeXml(reader.title)}</title>
      <link>${escapeXml(itemUrl)}</link>
      <guid isPermaLink="true">${escapeXml(itemUrl)}</guid>
      <pubDate>${toRfc822Date(reader.publishedDate)}</pubDate>
      <category>${escapeXml(reader.categoryLabel)}</category>
      <enclosure url="${escapeXml(coverUrl)}" length="0" type="${getImageMimeType(coverUrl)}" />
      <description>${wrapCdata(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>工程白話文 BuildScope｜工程圖解庫</title>
    <link>${SITE_URL}/visual-library/</link>
    <description>BuildScope 最新工程圖解、實務重點及學習資源。</description>
    <language>zh-HK</language>
    <lastBuildDate>${toRfc822Date(latestDate)}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
};
