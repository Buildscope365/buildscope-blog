import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getReaders } from "../data/readers";

const site = "https://buildscope-blog.com";
const staticPaths = ["/", "/about/", "/ai-tools/", "/blog/", "/dictionary/", "/ebooks/", "/news/", "/pro/", "/templates/", "/tools/", "/tools/retention/", "/visual-library/"];
const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export const GET: APIRoute = async () => {
  const [posts, news, readers] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("news", ({ data }) => !data.draft),
    getReaders(),
  ]);
  const entries: { path: string; date?: Date }[] = [
    ...staticPaths.map((path) => ({ path })),
    ...posts.map((post) => ({ path: `/blog/${post.id}/`, date: post.data.updatedDate ?? post.data.date })),
    ...news.map((item) => ({ path: `/news/${item.id}/`, date: item.data.date })),
    ...readers.map((reader) => ({ path: `/read/${reader.slug}/`, date: new Date(`${reader.publishedDate}T00:00:00+08:00`) })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(({ path, date }) => `<url><loc>${xml(new URL(path, site).toString())}</loc>${date ? `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>` : ""}</url>`).join("")}</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
