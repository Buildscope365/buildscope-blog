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
test('all ten units preserve supplied order without inventing full titles', () => {
  assert.equal(lessons.length,10);assert.equal(lessons[0][0],'positioning');assert.equal(lessons.at(-1)?.[0],'completion');
  assert.match(lessons[2][1],/待核實/);
});
test('learning API fails closed without D1 binding', async () => {
  const response=await learning(new Request('https://example.com/api/learn/lesson?id=collapse'),{} as never);
  assert.equal(response.status,503);
});
