import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getReaders } from "../data/readers";
import { getPublishedCourses } from "../data/courses";

const site = "https://buildscope-blog.com";
const staticPaths = ["/", "/about/", "/ai-tools/", "/blog/", "/comics/", "/dictionary/", "/ebooks/", "/learning-lab/", "/news/", "/pocket-guides/", "/pro/", "/templates/", "/tools/", "/tools/retention/", "/visual-library/"];
const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export const GET: APIRoute = async () => {
  const [posts, news, readers, comics, courses, englishProducts, englishInsights, englishResources] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("news", ({ data }) => !data.draft),
    getReaders(),
    getCollection("comics", ({ data }) => !data.draft),
    getPublishedCourses(),
    getCollection("englishProducts", ({ data }) => data.status === "published"),
    getCollection("englishInsights", ({ data }) => !data.draft),
    getCollection("englishResources", ({ data }) => !data.draft),
  ]);
  const entries: { path: string; date?: Date }[] = [
    ...staticPaths.map((path) => ({ path })),
    ...posts.map((post) => ({ path: `/blog/${post.id}/`, date: post.data.updatedDate ?? post.data.date })),
    ...news.map((item) => ({ path: `/news/${item.id}/`, date: item.data.date })),
    ...readers.map((reader) => ({ path: `/read/${reader.slug}/` })),
    ...comics.map((comic) => ({ path: `/comics/${comic.id}/`, date: comic.data.publishedDate })),
    ...courses.flatMap((course) => [{ path: `/learning-lab/${course.id}/` }, { path: `/learning-lab/${course.id}/preview/` }]),
    ...["/en/", "/en/pocket-library/", "/en/ebooks/", "/en/insights/", "/en/resources/", "/en/about/"].map((path) => ({ path })),
    ...englishProducts.map((product) => ({ path: `/en/${product.data.kind === "ebook" ? "ebooks" : "pocket-library"}/${product.data.slug}/`, date: product.data.publicationDate })),
    ...englishInsights.map((item) => ({ path: `/en/insights/${item.id}/`, date: item.data.date })),
    ...englishResources.map((item) => ({ path: `/en/resources/${item.id}/`, date: item.data.date })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(({ path, date }) => `<url><loc>${xml(new URL(path, site).toString())}</loc>${date ? `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>` : ""}</url>`).join("")}</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
