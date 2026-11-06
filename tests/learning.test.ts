import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { verifyStripe, lessons, learning } from '../worker/learning.ts';
import { createHmac } from 'node:crypto';
test('Stripe webhook rejects missing, stale, altered, and accepts authentic test payload', async () => {
  const raw='{"id":"evt_test","livemode":false}';const time=1762440000;
  const signed=createHmac('sha256','whsec_test').update(`${time}.${raw}`).digest('hex');
  assert.equal(await verifyStripe(raw,`t=${time},v1=${signed}`,'whsec_test',time),true);
  assert.equal(await verifyStripe(raw+'x',`t=${time},v1=${signed}`,'whsec_test',time),false);
  assert.equal(await verifyStripe(raw,`t=${time},v1=${signed}`,'whsec_test',time+301),false);
  assert.equal(await verifyStripe(raw,'','whsec_test',time),false);
});
test('nine course units preserve supplied order', () => {
  assert.equal(lessons.length,9);assert.equal(lessons[0][0],'positioning');assert.equal(lessons[6][0],'quick-check');assert.equal(lessons.at(-1)?.[0],'completion');
  assert.match(lessons[7][1],/待製作/);
});
test('learning API fails closed without D1 binding', async () => {
  const response=await learning(new Request('https://example.com/api/learn/lesson?id=collapse'),{} as never);
  assert.equal(response.status,503);
});
test('private lesson endpoint rejects an unauthenticated visitor', async () => {
  const db={prepare:()=>({bind:()=>({first:async()=>null})})};
  const response=await learning(new Request('https://example.com/api/learn/lesson?id=basics'),{LEARNING_DB:db} as never);
  assert.equal(response.status,401);
});
test('private course text is absent from the public Astro output', async () => {
  const { readFile }=await import('node:fs/promises');
  const html=await readFile(new URL('../dist/learn/dewatering/index.html',import.meta.url),'utf8');
  assert.ok(!html.includes('Effective Stress Principle'));
  assert.ok(!html.includes('Dewatering｜5 問 Quick Check'));
});
