import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const files = (await readdir("src/content/readers")).filter((name) => name.endsWith(".md"));
const sitemap = await readFile("dist/sitemap.xml", "utf8");
const slugs = new Set();
let images = 0;
let publicReaders = 0;
for (const name of files) {
  const source = await readFile(join("src/content/readers", name), "utf8");
  const frontmatter = source.split("---", 3)[1];
  assert.ok(frontmatter, `${name}: missing frontmatter`);
  const slug = frontmatter.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
  assert.ok(slug && !slugs.has(slug), `${name}: missing or duplicate slug`);
  slugs.add(slug);
  const paths = [...frontmatter.matchAll(/^\s*-\s+src:\s*["']?([^\s"']+)["']?\s*$/gm)].map((match) => match[1]);
  assert.ok(paths.length >= 1, `${slug}: missing slides`);
  assert.equal(new Set(paths).size, paths.length, `${slug}: duplicate slides`);
  for (const path of paths) {
    assert.ok(path.startsWith("/images/"), `${slug}: non-local image ${path}`);
    assert.ok((await stat(join("public", path.slice(1)))).isFile(), `${slug}: missing ${path}`);
    images++;
  }
  if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
  assert.ok(sitemap.includes(`<loc>https://buildscope-blog.com/read/${slug}/</loc>`), `${slug}: missing from sitemap`);
  const html = await readFile(join("dist/read", slug, "index.html"), "utf8");
  const rendered = [...html.matchAll(/<figure\b[^>]*\bdata-slide\b[^>]*>[\s\S]*?<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(rendered, paths, `${slug}: rendered slide order differs from content`);
  publicReaders++;
}
console.log(`Reader assets: ${files.length} entries, ${publicReaders} public URLs, ${images} images; all sequences verified.`);
