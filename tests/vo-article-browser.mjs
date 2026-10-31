import { chromium } from "playwright";
import { strict as assert } from "node:assert";
import { mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";

const server = createServer(async (req, res) => {
  const route = new URL(req.url, "http://localhost").pathname;
  const path = join("dist", route.endsWith("/") ? `${route}index.html` : route);
  try {
    const bytes = await readFile(path);
    res.setHeader("Content-Type", path.endsWith(".html") ? "text/html; charset=utf-8" : path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "application/javascript" : path.endsWith(".webp") ? "image/webp" : path.endsWith(".png") ? "image/png" : "application/octet-stream");
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = process.env.TEST_BASE_URL ?? `http://127.0.0.1:${server.address().port}`;
const slug = "vo-instruction-payment-entitlement";
const screenshots = "qa/vo-instruction";
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" });
try {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const response = await page.goto(`${base}/blog/${slug}/`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.match(await page.title(), /VO Instruction/);
    assert.equal(await page.locator("link[rel=canonical]").getAttribute("href"), `https://buildscope-blog.com/blog/${slug}/`);
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
    assert.equal(schema["@type"], "Article");
    assert.equal(schema.mainEntityOfPage["@id"], `https://buildscope-blog.com/blog/${slug}/`);
    const articleImages = page.locator("article .cover-figure img, article .article-body img");
    assert.equal(await articleImages.count(), 4);
    for (const img of await articleImages.all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate((node) => node.decode()); }
    const images = await articleImages.evaluateAll((nodes) => nodes.map((img) => ({ src: img.getAttribute("src"), alt: img.alt, complete: img.complete, width: img.naturalWidth })));
    assert.ok(images.every((img) => img.alt && img.complete && img.width > 0), JSON.stringify(images));
    assert.equal(await page.locator("article a[href*='skool.com/buildscope-learning-lab-1916']").count(), 2);
    assert.equal(await page.locator("article a[href*='devb.gov.hk']").count() >= 2, true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 12);
    if (overflow) console.log(name, await page.evaluate(() => ({width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 10).map((el) => [el.tagName, el.className, Math.round(el.getBoundingClientRect().right)])})));
    assert.equal(overflow, false, `${name} horizontal overflow`);
    await page.screenshot({ path: `${screenshots}/${name}.png`, fullPage: true });
    await page.goto(`${base}/blog/`, { waitUntil: "networkidle" });
    assert.equal(await page.locator(`a[href='/blog/${slug}/']`).count() > 0, true);
    await page.close();
    console.log(`${name}: article, metadata, 4 images, links, index and overflow passed`);
  }
} finally {
  await browser.close();
  server.close();
}
