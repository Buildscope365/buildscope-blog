import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const root = new URL("../dist/", import.meta.url).pathname;
const slugs = ["nec4", "ai-m365", "pnrc", "dewatering"];
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const paths = ["learning-lab", ...slugs.flatMap((slug) => [`learning-lab/${slug}`, `learning-lab/${slug}/preview`])];
for (const path of paths) {
  const file = join(root, path, "index.html");
  assert.ok(existsSync(file), `Missing generated page: /${path}/`);
  const html = readFileSync(file, "utf8");
  assert.ok(html.includes(`https://buildscope-blog.com/${path}/`), `Canonical missing: /${path}/`);
  assert.ok(sitemap.includes(`https://buildscope-blog.com/${path}/`), `Sitemap missing: /${path}/`);
  for (const href of html.matchAll(/\bhref="(\/learning-lab\/[^"?#]*)"/g)) {
    assert.ok(existsSync(join(root, href[1], "index.html")), `Broken Learning Lab link: ${href[1]}`);
  }
}
for (const slug of slugs) {
  const landing = readFileSync(join(root, `learning-lab/${slug}/index.html`), "utf8");
  const preview = readFileSync(join(root, `learning-lab/${slug}/preview/index.html`), "utf8");
  assert.ok(landing.includes(`/learning-lab/${slug}/preview/`));
  assert.ok(preview.includes("data-cta-location=\"learning_lab_preview\""));
  if (slug !== "pnrc") assert.ok(!landing.includes(`/classroom/`), `Unverified classroom on ${slug}`);
}
console.log("Learning Lab: 9 routes, sitemap, canonical, internal links and CTA checks passed.");
