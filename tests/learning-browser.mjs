import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4321';
const out=process.env.SCREENSHOT_DIR||'/tmp/buildscope-dewatering-shots';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
    const page=await browser.newPage({viewport});
    await page.goto(`${base}/learn/dewatering/`,{waitUntil:'networkidle'});
    assert.match(await page.title(),/#009/);
    const cover=page.locator('.cover img');
    assert.equal(await cover.evaluate(el=>el.complete&&el.naturalWidth>0),true);
    assert.equal(await page.locator('[data-lesson]').count(),9);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: horizontal overflow`);
    await page.screenshot({path:`${out}/dewatering-${name}.png`,fullPage:true});
    await page.locator('[data-lesson="systems"]').click();
    assert.match(await page.locator('#reader-title').innerText(),/System/);
    assert.equal(await page.locator('#next').isEnabled(),true);
    await page.locator('#next').click();
    assert.match(await page.locator('#reader-title').innerText(),/地下水點樣被抽走/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.close();
  }
  const page=await browser.newPage();
  let ready=false;
  await page.route('**/api/learn/me',route=>route.fulfill({json:{member:{id:'member-test',email:'test@example.com'},access:false,billingConfigured:true}}));
  await page.route('**/api/learn/lessons',route=>route.fulfill({json:{lessons:['positioning','basics','systems','drawdown','settlement','failures','quick-check'].map(id=>({id,ready:ready||id!=='quick-check',completed:false})),access:false}}));
  await page.goto(`${base}/learn/dewatering/`,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#monthly').isDisabled(),true,'incomplete course must not offer test checkout');
  ready=true;
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#monthly').isEnabled(),true,'published course with test billing may offer checkout');
  await page.close();
} finally { await browser.close(); }
