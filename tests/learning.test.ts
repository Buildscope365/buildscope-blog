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
test('private lesson import escapes quotes and defaults to unpublished', async () => {
  const { buildImportSql } = await import('../scripts/prepare-learning-import.mjs');
  const ids=['positioning','basics','systems','drawdown','settlement','failures','quick-check'];
  const sql=buildImportSql({courseId:'dewatering',lessons:ids.map(id=>({id,body:"What's groundwater? ".repeat(12)}))});
  assert.match(sql,/What''s groundwater/);
  assert.equal((sql.match(/published\) VALUES/g)||[]).length,7);
  assert.ok(!sql.includes('published) VALUES(\'dewatering\',\'basics\',\'What\'s groundwater'));
  assert.ok(sql.includes('published=0'));
});
test('private lesson image rejects unauthenticated request', async () => {
  const db={prepare:()=>({bind:()=>({first:async()=>null})})};
  const response=await learning(new Request('https://example.com/api/learn/media/lesson-1.webp'),{LEARNING_DB:db} as never);
  assert.equal(response.status,401);
});
test('private lesson images never enter public output', async () => {
  const { access }=await import('node:fs/promises');
  for (let i=1;i<=6;i++) await assert.rejects(access(new URL(`../public/images/learning/dewatering/lesson-${i}.webp`,import.meta.url)));
});
test('public course cover is available while lesson covers stay private', async () => {
  const { stat }=await import('node:fs/promises');
  const cover=await stat(new URL('../dist/images/learning/dewatering/course-cover.webp',import.meta.url));
  assert.ok(cover.size>100000);
});
test('member media enforces entitlement and publication before reading R2', async () => {
  const { createHash }=await import('node:crypto');
  const token='a'.repeat(64), tokenHash=createHash('sha256').update(token).digest('hex');
  let granted=false, published=false, reads=0;
  const db={prepare:(sql:string)=>({bind:(...params:unknown[])=>({first:async()=>{
    if(sql.includes('FROM sessions')) return params[0]===tokenHash ? {id:'member-1',email:'test@example.com',stripe_customer_id:null}:null;
    if(sql.includes('FROM access_grants')) return granted ? {1:1}:null;
    if(sql.includes('FROM subscriptions')) return null;
    if(sql.includes('FROM lesson_content')) return published ? {1:1}:null;
    throw new Error(`Unexpected SQL: ${sql}`);
  }})})};
  const media={get:async(key:string)=>{reads++;assert.equal(key,'dewatering/lesson-1.webp');return {body:new Uint8Array([82,73,70,70])};}};
  const request=new Request('https://example.com/api/learn/media/lesson-1.webp',{headers:{cookie:`bs_member=${token}`}});
  const env={LEARNING_DB:db,LEARNING_MEDIA:media} as never;
  assert.equal((await learning(request,env)).status,403);
  granted=true;
  assert.equal((await learning(request,env)).status,404);
  published=true;
  const response=await learning(request,env);
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Content-Type'),'image/webp');
  assert.equal(reads,1);
  granted=false;
  assert.equal((await learning(request,env)).status,403);
  assert.equal(reads,1);
});
