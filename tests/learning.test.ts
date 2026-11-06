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
test('new registration fails closed without transactional email and rejects cross-origin posts', async () => {
  const db={prepare:()=>({bind:()=>({first:async()=>null})})};
  const payload=JSON.stringify({email:'person@example.com',password:'long-test-password'});
  const request=(origin:string)=>new Request('https://example.com/api/learn/register',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:payload});
  assert.equal((await learning(request('https://another.example'),{LEARNING_DB:db} as never)).status,403);
  assert.equal((await learning(request('https://example.com'),{LEARNING_DB:db} as never)).status,503);
});
test('expired account token cannot verify an email', async () => {
  const db={prepare:()=>({bind:()=>({first:async()=>null})})};
  const request=new Request('https://example.com/api/learn/verify',{method:'POST',headers:{Origin:'https://example.com'},body:JSON.stringify({token:'a'.repeat(64)})});
  assert.equal((await learning(request,{LEARNING_DB:db} as never)).status,400);
});
test('private lesson images never enter public output', async () => {
  const { access }=await import('node:fs/promises');
  for (let i=1;i<=6;i++) await assert.rejects(access(new URL(`../public/images/learning/dewatering/lesson-${i}.webp`,import.meta.url)));
});
test('public course cover source is available while lesson covers stay private', async () => {
  const { stat }=await import('node:fs/promises');
  const cover=await stat(new URL('../public/images/learning/dewatering/course-cover.webp',import.meta.url));
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
test('PDF resource stays private until entitlement and resource publication', async () => {
  const {createHash}=await import('node:crypto');
  const token='e'.repeat(64), tokenHash=createHash('sha256').update(token).digest('hex');
  let granted=false,published=false,reads=0;
  const db={prepare:(sql:string)=>({bind:(...params:unknown[])=>({first:async()=>{
    if(sql.includes('FROM sessions')) return params[0]===tokenHash?{id:'member',email:'test@example.com',stripe_customer_id:null}:null;
    if(sql.includes('FROM access_grants')) return granted?{1:1}:null;
    if(sql.includes('FROM subscriptions')) return null;
    if(sql.includes('FROM lesson_content')) {assert.equal(params[1],'resource');return published?{1:1}:null;}
    throw Error(sql);
  }})})};
  const media={get:async(key:string)=>{reads++;assert.equal(key,'dewatering/resource-checklist.pdf');return {body:new Uint8Array([37,80,68,70])};}};
  const env={LEARNING_DB:db,LEARNING_MEDIA:media} as never;
  assert.equal((await learning(new Request('https://example.com/api/learn/resource'),env)).status,401);
  const request=new Request('https://example.com/api/learn/resource',{headers:{cookie:`bs_member=${token}`}});
  assert.equal((await learning(request,env)).status,403);
  granted=true;
  assert.equal((await learning(request,env)).status,404);
  published=true;
  const response=await learning(request,env);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.match(response.headers.get('Content-Disposition')||'',/attachment/);
  assert.equal(reads,1);
});
test('expired and canceled subscriptions cannot access a paid lesson', async () => {
  const {createHash}=await import('node:crypto');
  const token='c'.repeat(64), tokenHash=createHash('sha256').update(token).digest('hex');
  let status='active', periodEnd=Math.floor(Date.now()/1000)-1;
  const db={prepare:(sql:string)=>({bind:(...params:unknown[])=>({first:async()=>{
    if(sql.includes('FROM sessions')) return params[0]===tokenHash?{id:'member',email:'verified@example.com',stripe_customer_id:'cus_test'}:null;
    if(sql.includes('FROM access_grants')) return null;
    if(sql.includes('FROM subscriptions')) return status==='active'&&periodEnd>Number(params[1])?{1:1}:null;
    throw new Error(sql);
  }})})};
  const request=new Request('https://example.com/api/learn/lesson?id=basics',{headers:{cookie:`bs_member=${token}`}});
  const env={LEARNING_DB:db} as never;
  assert.equal((await learning(request,env)).status,403);
  periodEnd=Math.floor(Date.now()/1000)+3600;status='canceled';
  assert.equal((await learning(request,env)).status,403);
});
test('test checkout requires the exact seven published teaching units', async () => {
  const {createHash}=await import('node:crypto');
  const token='d'.repeat(64), tokenHash=createHash('sha256').update(token).digest('hex');
  let published=['positioning','basics','systems','drawdown','settlement','failures','resource'];
  const db={prepare:(sql:string)=>({bind:(...params:unknown[])=>({
    first:async()=>{
      if(sql.includes('FROM sessions')) return params[0]===tokenHash?{id:'member',email:'test@example.com',stripe_customer_id:null}:null;
      if(sql.includes('FROM access_grants')||sql.includes('FROM subscriptions')) return null;
      throw Error(sql);
    },
    all:async()=>{
      if(sql.includes('FROM lesson_content')) return {results:published.map(lesson_id=>({lesson_id}))};
      throw Error(sql);
    },
  })})};
  const request=new Request('https://example.com/api/learn/checkout',{method:'POST',headers:{Origin:'https://example.com',cookie:`bs_member=${token}`},body:JSON.stringify({interval:'monthly'})});
  assert.equal((await learning(request,{LEARNING_DB:db} as never)).status,409);
  published=[...published.slice(0,-1),'quick-check'];
  assert.equal((await learning(request,{LEARNING_DB:db} as never)).status,503);
});
test('signed Stripe events only reconcile a recorded checkout and ignore retries', async () => {
  const seen=new Set<string>();
  let customer:string|null=null, checkoutSubscription:string|null=null, storedStatus:string|null=null, fetches=0, currentStatus='active', currentPrice='price_monthly';
  const db={
    prepare:(sql:string)=>({bind:(...args:unknown[])=>({
      first:async()=>{
        if(sql.includes('FROM stripe_events')) return seen.has(String(args[0]))?{1:1}:null;
        if(sql.includes('FROM checkout_sessions WHERE stripe_session_id')) return args[0]==='cs_test_ours'&&args[1]==='member-1'?{member_id:'member-1'}:null;
        if(sql.includes('FROM members WHERE stripe_customer_id')) return args[0]===customer?{id:'member-1'}:null;
        if(sql.includes('FROM checkout_sessions WHERE stripe_subscription_id')) return args[0]===checkoutSubscription&&args[1]==='member-1'?{price_id:'price_monthly'}:null;
        throw Error(sql);
      },
      run:async()=>{
        if(sql.startsWith('UPDATE members')) customer=String(args[0]);
        else if(sql.startsWith('UPDATE checkout_sessions')) checkoutSubscription=String(args[0]);
        else if(sql.startsWith('INSERT INTO subscriptions')) storedStatus=String(args[2]);
        else if(sql.startsWith('INSERT OR IGNORE INTO stripe_events')) seen.add(String(args[0]));
        else throw Error(sql);
      },
    })}),
    batch:async(statements:Array<{run:()=>Promise<void>}>)=>{for(const statement of statements) await statement.run();},
  };
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(input)=>{fetches++;const id=String(input).split('/').at(-1);return new Response(JSON.stringify({id,customer:'cus_test_ours',status:currentStatus,items:{data:[{current_period_end:Math.floor(Date.now()/1000)+3600,price:{id:currentPrice}}]}}),{status:200});};
  const send=async(id:string,type:string,object:object)=>{
    const raw=JSON.stringify({id,livemode:false,type,data:{object}}),timestamp=Math.floor(Date.now()/1000);
    const signature=createHmac('sha256','whsec_test').update(`${timestamp}.${raw}`).digest('hex');
    return learning(new Request('https://example.com/api/learn/stripe/webhook',{method:'POST',headers:{'Stripe-Signature':`t=${timestamp},v1=${signature}`},body:raw}),{LEARNING_DB:db,STRIPE_SECRET_KEY:'sk_test_placeholder',STRIPE_WEBHOOK_SECRET:'whsec_test',STRIPE_MONTHLY_PRICE_ID:'price_monthly'} as never);
  };
  try {
    const completed={id:'cs_test_ours',mode:'subscription',client_reference_id:'member-1',customer:'cus_test_ours',subscription:'sub_test_ours'};
    assert.equal((await send('evt_1','checkout.session.completed',completed)).status,200);
    assert.equal(storedStatus,'active');
    assert.equal((await send('evt_1','checkout.session.completed',completed)).status,200);
    assert.equal(fetches,1);
    assert.equal((await send('evt_2','customer.subscription.updated',{id:'sub_test_unrelated'})).status,503);
    assert.equal(storedStatus,'active');
    currentStatus='canceled';
    assert.equal((await send('evt_3','customer.subscription.deleted',{id:'sub_test_ours'})).status,200);
    assert.equal(storedStatus,'canceled');
    currentStatus='active';currentPrice='price_not_configured';
    assert.equal((await send('evt_4','customer.subscription.updated',{id:'sub_test_ours'})).status,200);
    assert.equal(storedStatus,'ineligible');
  } finally {globalThis.fetch=originalFetch;}
});
