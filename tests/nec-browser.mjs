import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const shots = process.env.SCREENSHOT_DIR || "/tmp/buildscope-phase1-screenshots";
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    const page = await context.newPage();
    const errors = []; const posts = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => { if (r.method() === "POST") posts.push(r.url()); });
    await page.goto(`${base}/tools/nec-option-c-forecast/`);
    assert.match(await page.title(), /NEC4 Option C Target Cost Forecast Tool/);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://buildscope-blog.com/tools/nec-option-c-forecast/");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: initial horizontal overflow`);
    if (name === "mobile") {
      assert.equal(await page.evaluate(() => innerWidth), 390);
      assert.equal(await page.evaluate(() => innerHeight), 844);
      assert.equal(await page.locator(".workbench").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length), 1, "mobile: results below form");
    }
    await page.getByRole("button", { name: "只使用必要 Cookie" }).click();
    await page.locator('[name="target"]').fill("1000");
    await page.locator('[name="cost"]').fill("900");
    await page.locator('[name="fee"]').fill("0");
    await page.locator('[name="stress"]').fill("0");
    await page.locator('#range-list [name="rate"]').first().fill("50");
    await page.locator('#range-list [name="rate"]').last().fill("75");
    await page.getByRole("button", { name: "＋ 新增已實施 CE" }).click();
    await page.locator('#implemented-list [name="ref"]').fill("CE-01");
    await page.locator('#implemented-list [name="targetChange"]').fill("200");
    await page.getByRole("button", { name: "＋ 新增待定 CE" }).click();
    await page.locator('#pending-list [name="ref"]').fill("P-01");
    await page.locator('#pending-list [name="targetChange"]').fill("100");
    await page.locator('#pending-list [name="costChange"]').fill("50");
    await page.locator('#pending-list [name="included"]').check();
    await page.getByRole("button", { name: "計算 Forecast" }).click();
    const current = page.locator(".scenario").first();
    const selected = page.locator(".scenario").nth(1);
    assert.match(await current.innerText(), /1,200\.00/);
    assert.match(await current.innerText(), /150\.00/);
    assert.match(await selected.innerText(), /1,300\.00/);
    assert.match(await selected.innerText(), /950\.00/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: result horizontal overflow`);
    if (name === "mobile") {
      const boxes = await page.locator(".entry input, .entry button, #download-csv").evaluateAll(items => items.map(el => el.getBoundingClientRect().width));
      assert.ok(boxes.every(width => width <= 390 && width >= 35), "mobile: usable controls");
    }
    await page.locator(".scenario details").first().locator("summary").click();
    assert.match(await current.locator("details").innerText(), /本段 PWDD/);
    await page.addStyleTag({ content: ".site-header{position:static!important}.output{position:static!important;max-height:none!important;overflow:visible!important}" });
    await page.screenshot({ path: `${shots}/nec-option-c-${name}.png`, fullPage: true });
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "下載 CSV" }).click();
    const download = await downloadEvent;
    const csv = await readFile(await download.path(), "utf8");
    assert.match(csv, /CE-01/); assert.match(csv, /P-01/); assert.match(csv, /1,300\.00/);
    await page.locator('#range-list [name="rate"]').first().fill("101");
    assert.equal(await page.locator("#forecast-result").isVisible(), false, "stale result hidden after edit");
    await page.getByRole("button", { name: "計算 Forecast" }).click();
    assert.match(await page.locator("#forecast-error").innerText(), /不可超過 100%/);
    assert.deepEqual(errors, []); assert.deepEqual(posts, []);
    await context.close();
  }
  console.log(`NEC Option C desktop and 390×844 mobile QA passed; screenshots: ${shots}`);
} finally { await browser.close(); }
