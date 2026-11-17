import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const shots = process.env.SCREENSHOT_DIR || "/tmp/buildscope-phase1-screenshots";
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
try {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/learning-lab/`);
    assert.equal(await page.locator("[data-course]").count(), 4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: catalog overflow`);
    await page.locator("#lab-search").fill("PNRC");
    assert.equal(await page.locator("[data-course]:visible").count(), 1);
    await page.locator("#lab-search").fill("");
    await page.getByRole("button", { name: "地盤施工" }).click();
    assert.equal(await page.locator("[data-course]:visible").count(), 1);
    await page.getByRole("button", { name: "全部", exact: true }).click();
    await page.screenshot({ path: `${shots}/learning-lab-catalog-${name}.png`, fullPage: true });
    for (const slug of ["nec4", "ai-m365", "pnrc", "dewatering"]) {
      await page.goto(`${base}/learning-lab/${slug}/`);
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: ${slug} overflow`);
      await page.getByRole("link", { name: "免費閱讀 Preview" }).click();
      await page.locator(".lab-article h2").first().waitFor();
      assert.equal(new URL(page.url()).pathname, `/learning-lab/${slug}/preview/`);
      assert.equal(await page.locator(".lab-cta a").count(), 1);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("Learning Lab browser QA passed at desktop and mobile widths.");
} finally { await browser.close(); }
