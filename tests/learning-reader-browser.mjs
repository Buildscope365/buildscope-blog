import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base=process.env.LEARNING_WORKER_URL||'http://127.0.0.1:8787';
const out=process.env.SCREENSHOT_DIR||'/tmp/buildscope-dewatering-shots';
const admin=action=>fetch(`${base}/api/learn/admin/${action}`,{method:'POST',headers:{Authorization:'Bearer ci_admin_token','Content-Type':'application/json'},body:JSON.stringify({memberId:'member-browser',skoolReference:'ci-browser-verified'})});
assert.equal((await admin('grant')).status,200);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
    const context=await browser.newContext({viewport});
    await context.addCookies([{name:'bs_member',value:'b'.repeat(64),url:base}]);
    const page=await context.newPage();
    await page.goto(`${base}/learn/dewatering/`,{waitUntil:'networkidle'});
    await page.locator('[data-lesson="basics"]').click();
    await page.locator('#lesson-content').waitFor({state:'visible'});
    assert.equal(await page.locator('#lesson-content').innerText(),'CI synthetic lesson, no paid content');
    assert.equal(await page.locator('#lesson-cover').evaluate(async image=>{if(!image.complete) await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});return image.naturalWidth>0;}),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: paid reader overflow`);
    await page.screenshot({path:`${out}/dewatering-member-${name}.png`,fullPage:true});
    if(name==='mobile') {
      await page.locator('#next').click();
      assert.match(await page.locator('#reader-title').innerText(),/System/);
      for(const [index,id] of ['basics','systems','drawdown','settlement','failures','quick-check'].entries()) {
        await page.locator(`[data-lesson="${id}"]`).click();
        await page.locator('#lesson-content').waitFor({state:'visible'});
        await page.locator('#complete').click();
        await page.waitForFunction(expected=>document.querySelector('#progress-label')?.textContent===`${expected} / 6`,index+1);
      }
      await page.locator('[data-lesson="completion"]').click();
      await page.locator('#lesson-content').waitFor({state:'visible'});
      assert.match(await page.locator('#lesson-content').innerText(),/已完成/);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile completion overflow');
    }
    await context.close();
  }
} finally {
  await browser.close();
  assert.equal((await admin('revoke')).status,200);
}
console.log('Member desktop/mobile reader, private synthetic covers, progress persistence, completion, and Skool revocation verified.');
