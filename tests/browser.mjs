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
    await page.getByRole("button", { name: "複製結果" }).click();
    assert.match(await page.locator("#copy-status").innerText(), /已複製/);
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /本期保留款：0.29/);
    await page.screenshot({ path: `${shots}/retention-${name}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    assert.equal(gaRequests.length, 0, "denied consent must not load GA");

    await page.goto(`${base}/blog/eot-claim-five-elements/`);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://buildscope-blog.com/blog/eot-claim-five-elements/");
    assert.equal(JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())["@type"], "Article");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: article horizontal overflow`);
    await page.screenshot({ path: `${shots}/article-${name}.png`, fullPage: true });

    await page.goto(`${base}/read/method-statement-use/`);
    const slides = page.locator("[data-slide]");
    assert.equal(await slides.count(), 10);
    const sources = await slides.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src")));
    assert.deepEqual(sources, Array.from({ length: 10 }, (_, i) => `/images/readers/method-statement-use/${String(i + 1).padStart(2, "0")}.png`));
    for (const src of sources) assert.equal((await page.request.get(new URL(src, base).toString())).status(), 200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: Reader overflow`);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`Browser QA passed; screenshots: ${shots}`);
} finally { await browser.close(); }
