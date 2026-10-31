import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const shots = process.env.SCREENSHOT_DIR || "/tmp/buildscope-sop-screenshots";
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage(); const errors = []; const submitted = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => { if (r.method() === "POST") submitted.push(r.url()); });
    await page.goto(`${base}/tools/sop-payment-calculator/`);
    assert.match(await page.title(), /SOP Payment Deadline Calculator/);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://buildscope-blog.com/tools/sop-payment-calculator/");
    assert.equal(JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())["@type"], "WebApplication");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} horizontal overflow`);
    await page.locator('[name="tier"]').selectOption("main");
    await page.locator('[name="project"]').selectOption("public");
    await page.locator('[name="mainContractDate"]').fill("2026-01-01");
    await page.locator('[name="kind"]').selectOption("works");
    await page.locator('[name="mainValue"]').fill("5000000");
    await page.locator('[name="hongKong"]').selectOption("yes");
    await page.locator('[name="serviceDate"]').fill("2026-03-01");
    await page.locator('[name="asOf"]').fill("2026-03-02");
    await page.locator('[name="claimValid"]').check();
    await page.locator('[name="holidaysConfirmed"]').check();
    await page.getByRole("button", { name: "計算期限" }).click();
    assert.equal(await page.locator("#stat-response").innerText(), "2026-03-31");
    assert.equal(await page.locator("#effective-payment").innerText(), "2026-04-30");
    assert.match(await page.locator("#coverage").innerText(), /可能適用/);
    await page.addStyleTag({ content: ".site-header{position:static!important}" });
    await page.screenshot({ path: `${shots}/sop-${name}.png`, fullPage: true });
    await page.getByRole("button", { name: "複製結果" }).click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /2026-04-30/);
    await page.locator('[name="holidaysConfirmed"]').uncheck();
    await page.getByRole("button", { name: "計算期限" }).click();
    assert.match(await page.locator("#risk").innerText(), /未足以確定逾期/);
    assert.deepEqual(submitted, []); assert.deepEqual(errors, []);
    await context.close();
  }
} finally { await browser.close(); }
console.log(`SOP browser QA passed; screenshots: ${shots}`);
