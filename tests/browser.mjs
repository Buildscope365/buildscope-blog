import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const shots = process.env.SCREENSHOT_DIR || "/tmp/buildscope-phase1-screenshots";
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const gaRequests = [];
    page.on("request", (request) => { if (request.url().includes("googletagmanager.com/gtag/js")) gaRequests.push(request.url()); });
    await page.goto(`${base}/tools/retention/`);
    assert.match(await page.title(), /保留款計算機/);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: horizontal overflow`);
    assert.equal(gaRequests.length, 0, "GA must wait for consent");
    await page.getByRole("button", { name: "只使用必要 Cookie" }).click();
    await page.getByRole("button", { name: "計算保留款" }).click();
    assert.match(await page.locator("#retention-error").innerText(), /請填寫全部/);
    await page.locator('[name="payment"]').fill("100000");
    await page.locator('[name="percentage"]').fill("5");
    await page.locator('[name="cap"]').fill("15000");
    await page.locator('[name="previous"]').fill("14999.71");
    await page.getByRole("button", { name: "計算保留款" }).click();
    assert.equal(await page.locator("#current").innerText(), "0.29");
    assert.equal(await page.locator("#cumulative").innerText(), "15,000.00");
    // A full-page capture from a scrolled form otherwise paints the sticky header over inputs.
    await page.addStyleTag({ content: ".site-header{position:static!important}" });
    await page.screenshot({ path: `${shots}/retention-${name}.png`, fullPage: true });
    await page.getByRole("button", { name: "複製結果" }).click();
    await page.waitForFunction(() => document.querySelector("#copy-status")?.textContent?.includes("已複製") || document.querySelector("#copy-status")?.textContent?.includes("未能複製"));
    assert.match(await page.locator("#copy-status").innerText(), /已複製/);
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /本期保留款：0.29/);
    await page.locator('[name="previous"]').fill("15000.01");
    await page.getByRole("button", { name: "計算保留款" }).click();
    assert.match(await page.locator("#retention-error").innerText(), /不可超過上限/);
    await page.locator('[name="payment"]').fill("0.01");
    await page.locator('[name="percentage"]').fill("50");
    await page.locator('[name="cap"]').fill("1");
    await page.locator('[name="previous"]').fill("0");
    await page.getByRole("button", { name: "計算保留款" }).click();
    assert.equal(await page.locator("#current").innerText(), "0.01", "half-cent rounds up");
    assert.deepEqual(errors, []);
    assert.equal(gaRequests.length, 0, "denied consent must not load GA");
    await page.evaluate(() => window.BuildScopeAnalytics.setConsent("granted"));
    assert.equal(gaRequests.length, 1, "GA loads only after explicit consent");

    await page.goto(`${base}/blog/`);
    assert.equal(await page.locator(".post").count(), 2);
    assert.equal(await page.locator('a[href="/blog/vo-instruction-payment-entitlement/"]').count() > 0, true);
    await page.locator("#article-search").fill("VO Instruction");
    assert.equal(await page.locator(".post:visible").count(), 1);
    await page.locator("#article-search").fill("不存在的文章");
    assert.equal(await page.locator("#no-results").isVisible(), true);

    await page.goto(`${base}/blog/vo-instruction-payment-entitlement/`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    assert.equal(canonical, "https://buildscope-blog.com/blog/vo-instruction-payment-entitlement/");
    const article = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    assert.equal(article["@type"], "Article");
    assert.equal(article.mainEntityOfPage["@id"], canonical);
    assert.equal(article.author["@type"], "Organization");
    assert.equal(article.datePublished, "2026-10-31T00:00:00.000Z");
    assert.equal("dateModified" in article, false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: article horizontal overflow`);
    await page.screenshot({ path: `${shots}/article-${name}.png`, fullPage: true });

    await page.goto(`${base}/blog/subcontractor-cost-overrun-qs-guide/`);
    const newCanonical = "https://buildscope-blog.com/blog/subcontractor-cost-overrun-qs-guide/";
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), newCanonical);
    const newArticle = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    assert.equal(newArticle.mainEntityOfPage["@id"], newCanonical);
    assert.equal(newArticle.author["@type"], "Organization");
    assert.equal(newArticle.datePublished, "2026-11-01T00:00:00.000Z");
    assert.equal("dateModified" in newArticle, false);
    assert.equal(await page.locator("article figure img").count(), 4);
    for (const image of await page.locator("article figure img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
      assert.equal(await image.evaluate((element) => element.complete && element.naturalWidth > 0), true, `${name}: missing article image`);
      assert.ok((await image.getAttribute("alt"))?.length > 10);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: new article horizontal overflow`);
    await page.screenshot({ path: `${shots}/subcontractor-article-${name}.png`, fullPage: true });

    await page.goto(`${base}/read/method-statement-use/`);
    const slides = page.locator("[data-slide]");
    assert.equal(await slides.count(), 10);
    const sources = await slides.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src")));
    assert.deepEqual(sources, Array.from({ length: 10 }, (_, i) => `/images/readers/method-statement-use/${String(i + 1).padStart(2, "0")}.png`));
    for (const src of sources) assert.equal((await page.request.get(new URL(src, base).toString())).status(), 200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: Reader overflow`);
    await page.goto(`${base}/visual-library/`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: Library overflow`);
    assert.equal(await page.locator('a[href="/read/method-statement-use/"]').count() > 0, true);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`Browser QA passed; screenshots: ${shots}`);
} finally { await browser.close(); }
