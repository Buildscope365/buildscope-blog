const course = 'dewatering';
const cookieName = 'bs_member';
const enc = new TextEncoder();
export const lessons = [
  ['positioning', 'BuildScope 100｜#009 Course 定位'],
  ['basics', 'Lesson 1/6｜Dewatering 係咪只係抽走地下水？'],
  ['systems', 'Lesson 2/6｜Dewatering System 有邊幾種？'],
  ['drawdown', 'Lesson 3/6｜地下水點樣被抽走？'],
  ['settlement', 'Lesson 4/6｜點解抽地下水會令地面沉降？'],
  ['failures', 'Lesson 5/6｜Dewatering 做得唔好，會出咩事？'],
  ['quick-check', 'Lesson 6/6｜QS／PM／Engineer 現場應該問邊 5 條問題？'],
  ['resource', 'Resource｜Groundwater Control Checklist（待製作）'],
  ['completion', 'Course Completion｜#010 學習路線'],
] as const;

type LearningEnv = Env & { LEARNING_DB?: D1Database; STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string; STRIPE_MONTHLY_PRICE_ID?: string; STRIPE_ANNUAL_PRICE_ID?: string; LEARNING_ADMIN_TOKEN?: string; ASSETS: Fetcher };
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data: unknown, status = 200, extra: HeadersInit = {}) => new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const sha = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));
const equal = (a: string, b: string) => { if (a.length !== b.length) return false; let n = 0; for (let i = 0; i < a.length; i++) n |= a.charCodeAt(i) ^ b.charCodeAt(i); return n === 0; };
const passwordHash = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 210000, hash: 'SHA-256' }, key, 256)));
};
const getSession = async (request: Request, db: D1Database) => {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.split('=')[1];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare('SELECT m.id, m.email, m.stripe_customer_id FROM sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at>?').bind(await sha(token), Math.floor(Date.now()/1000)).first<{id:string;email:string;stripe_customer_id:string|null}>();
};
const requireOrigin = (request: Request) => { const origin = request.headers.get('Origin'); return origin === new URL(request.url).origin; };
const body = async (request: Request) => request.json().catch(() => ({})) as Promise<Record<string, unknown>>;
const cookie = (token: string, age = 60*60*24*14) => `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const entitlement = async (db: D1Database, id: string) => {
  const now = Math.floor(Date.now()/1000);
  const grant = await db.prepare('SELECT 1 FROM access_grants WHERE member_id=? AND course_id=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?) LIMIT 1').bind(id, course, now).first();
  const sub = await db.prepare("SELECT 1 FROM subscriptions WHERE member_id=? AND status IN ('active','trialing') AND period_end>? LIMIT 1").bind(id,now).first();
  return Boolean(grant || sub);
};
const stripe = async (env: LearningEnv, path: string, params: URLSearchParams) => {
  if (!env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) return null;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2026-02-25.clover' }, body: params });
  if (!response.ok) throw new Error(`Stripe ${response.status}`);
  return response.json() as Promise<{url:string;id:string}>;
};
export async function verifyStripe(raw: string, signature: string, secret: string, now = Math.floor(Date.now()/1000)) {
  const parts = Object.fromEntries(signature.split(',').map(x => x.split('=',2)));
  const timestamp = Number(parts.t);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now-timestamp)>300 || !parts.v1) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const digest = hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${raw}`))));
  return signature.split(',').some(x => x.startsWith('v1=') && equal(x.slice(3),digest));
}
export async function learning(request: Request, env: LearningEnv): Promise<Response> {
  const url = new URL(request.url), path = url.pathname;
  const db = env.LEARNING_DB;
  if (!db) return json({ error: 'Learning Centre 尚未設定資料庫' },503);
  if (path === '/api/learn/stripe/webhook') {
    if (request.method !== 'POST' || !env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) return json({error:'Unavailable'},503);
    const raw = await request.text();
    if (!(await verifyStripe(raw,request.headers.get('Stripe-Signature')||'',env.STRIPE_WEBHOOK_SECRET))) return json({error:'Invalid signature'},400);
    const event = JSON.parse(raw) as {id:string;livemode:boolean;type:string;created:number;data:{object:Record<string,any>}};
    if (event.livemode || !event.id) return json({error:'Test mode only'},400);
    const object = event.data.object;
    // Associate only the member ID stored by our own Checkout session, never an email claim.
    if (event.type === 'checkout.session.completed' && object.mode === 'subscription' && object.client_reference_id && object.customer) {
      const known=await db.prepare('SELECT id FROM members WHERE id=?').bind(object.client_reference_id).first();
      if (known) {
        await db.prepare('UPDATE members SET stripe_customer_id=? WHERE id=? AND (stripe_customer_id IS NULL OR stripe_customer_id=?)').bind(object.customer,object.client_reference_id,object.customer).run();
      }
    }
    const subscriptionId=event.type==='checkout.session.completed' ? object.subscription : event.type.startsWith('customer.subscription.') ? object.id : null;
    if (subscriptionId) {
      // Reconcile current Stripe state; webhooks may arrive out of order.
      const response=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Stripe-Version':'2026-02-25.clover'}});
      if (!response.ok) return json({error:'Stripe reconciliation failed'},502);
      const current=await response.json() as {id:string;customer:string;status:string;current_period_end?:number;items?:{data?:Array<{current_period_end?:number}>}};
      const member=await db.prepare('SELECT id FROM members WHERE stripe_customer_id=?').bind(current.customer).first<{id:string}>();
      if (!member) return json({error:'Unmatched customer; retry later'},503);
      const periodEnd=current.current_period_end||current.items?.data?.[0]?.current_period_end||0;
      await db.batch([
        db.prepare('INSERT INTO subscriptions(stripe_subscription_id,member_id,status,period_end,last_event_created) VALUES(?,?,?,?,?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=excluded.status,period_end=excluded.period_end,last_event_created=excluded.last_event_created WHERE excluded.last_event_created>=subscriptions.last_event_created').bind(current.id,member.id,current.status,periodEnd,Math.floor(Date.now()/1000)),
        db.prepare('INSERT OR IGNORE INTO stripe_events(id) VALUES(?)').bind(event.id),
      ]);
    }
    return json({received:true});
  }
  if (path === '/api/learn/register' || path === '/api/learn/login') {
    if (request.method !== 'POST' || !requireOrigin(request)) return json({error:'Invalid request'},403);
    const input = await body(request), email = String(input.email||'').trim().toLowerCase(), password = String(input.password||'');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length<12 || password.length>256) return json({error:'請輸入有效電郵及至少 12 字元密碼'},400);
    let member = await db.prepare('SELECT id,salt,password_hash,failed_attempts,locked_until FROM members WHERE email=?').bind(email).first<{id:string;salt:string;password_hash:string;failed_attempts:number;locked_until:number}>();
    if (path.endsWith('register')) {
      if (member) return json({error:'此電郵已登記'},409);
      const id = crypto.randomUUID(), salt = random();
      await db.prepare('INSERT INTO members(id,email,salt,password_hash) VALUES(?,?,?,?)').bind(id,email,salt,await passwordHash(password,salt)).run();
      member = {id,salt,password_hash:'',failed_attempts:0,locked_until:0};
    } else {
      if (member?.locked_until && member.locked_until>Date.now()/1000) return json({error:'請稍後再試'},429);
      const check = await passwordHash(password,member?.salt||random());
      if (!member || !equal(check,member.password_hash)) {
        if (member) await db.prepare('UPDATE members SET failed_attempts=failed_attempts+1,locked_until=CASE WHEN failed_attempts>=4 THEN ? ELSE 0 END WHERE id=?').bind(Math.floor(Date.now()/1000)+900,member.id).run();
        return json({error:'電郵或密碼不正確'},401);
      }
      await db.prepare('UPDATE members SET failed_attempts=0,locked_until=0 WHERE id=?').bind(member.id).run();
    }
    const token = random();
    await db.prepare('INSERT INTO sessions(token_hash,member_id,expires_at) VALUES(?,?,?)').bind(await sha(token),member.id,Math.floor(Date.now()/1000)+1209600).run();
    return json({ok:true},200,{'Set-Cookie':cookie(token)});
  }
  const member = await getSession(request,db);
  if (path === '/api/learn/me' && request.method === 'GET') return json({member:member ? {email:member.email,id:member.id} : null, access:member ? await entitlement(db,member.id):false, billingConfigured:Boolean(env.STRIPE_MONTHLY_PRICE_ID&&env.STRIPE_ANNUAL_PRICE_ID&&env.STRIPE_WEBHOOK_SECRET&&env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))});
  if (path === '/api/learn/lessons' && request.method === 'GET') {
    const ready=await db.prepare('SELECT lesson_id FROM lesson_content WHERE course_id=? AND published=1').bind(course).all<{lesson_id:string}>();
    const completed=member ? await db.prepare('SELECT lesson_id FROM learning_progress WHERE member_id=? AND course_id=?').bind(member.id,course).all<{lesson_id:string}>() : {results:[]};
    return json({lessons:lessons.map(([id,title])=>({id,title,ready:ready.results.some(x=>x.lesson_id===id),completed:completed.results.some(x=>x.lesson_id===id)})),access:member?await entitlement(db,member.id):false});
  }
  if (path === '/api/learn/lesson' && request.method === 'GET') {
    const id = url.searchParams.get('id');
    if (!lessons.some(([slug])=>slug===id)) return json({error:'Lesson not found'},404);
    if (!member) return json({error:'請先登入'},401);
    if (!(await entitlement(db,member.id))) return json({error:'會員課堂需先開通'},403);
    // Private D1 content is never served by static assets. Render as plain text on the client.
    const content=await db.prepare('SELECT body FROM lesson_content WHERE course_id=? AND lesson_id=? AND published=1').bind(course,id).first<{body:string}>();
    return content ? json({id,ready:true,body:content.body}) : json({id,ready:false,message:'課堂原始內容尚待核對及匯入，暫未開放。'},404);
  }
  if (!member) return json({error:'請先登入'},401);
  if (request.method !== 'POST' || !requireOrigin(request)) return json({error:'Invalid request'},403);
  if (path === '/api/learn/logout') {
    const token = request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`))?.split('=')[1];
    if (token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(token)).run();
    return json({ok:true},200,{'Set-Cookie':cookie('',0)});
  }
  if (path === '/api/learn/progress') {
    if (!(await entitlement(db,member.id))) return json({error:'Access denied'},403);
    const input = await body(request), id = String(input.id||'');
    if (!lessons.some(([slug])=>slug===id)) return json({error:'Invalid lesson'},400);
    const published=await db.prepare('SELECT 1 FROM lesson_content WHERE course_id=? AND lesson_id=? AND published=1').bind(course,id).first();
    if (!published) return json({error:'此課堂尚未發布，未能標記完成'},409);
    await db.prepare('INSERT OR IGNORE INTO learning_progress(member_id,course_id,lesson_id,completed_at) VALUES(?,?,?,?)').bind(member.id,course,id,Math.floor(Date.now()/1000)).run();
    return json({ok:true});
  }
  if (path === '/api/learn/admin/grant') {
    const supplied = request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
    if (!env.LEARNING_ADMIN_TOKEN || !equal(supplied,env.LEARNING_ADMIN_TOKEN)) return json({error:'Unauthorized'},401);
    const input=await body(request), id=String(input.memberId||''), reference=String(input.skoolReference||'').trim();
    if (!reference || reference.length>200 || !(await db.prepare('SELECT 1 FROM members WHERE id=?').bind(id).first())) return json({error:'Invalid verified member'},400);
    await db.prepare("INSERT INTO access_grants(id,member_id,course_id,source,reference,created_at) VALUES(?,? ,?,'skool_verified',?,?)").bind(crypto.randomUUID(),id,course,reference,Math.floor(Date.now()/1000)).run();
    return json({ok:true});
  }
  if (path === '/api/learn/checkout') {
    if (await entitlement(db,member.id)) return json({error:'已有課程權限，無需重複付款'},409);
    const published=await db.prepare('SELECT COUNT(*) AS count FROM lesson_content WHERE course_id=? AND published=1').bind(course).first<{count:number}>();
    if (!published || published.count<7) return json({error:'課堂未齊，測試 Checkout 暫停'},409);
    const input=await body(request), price=input.interval==='annual'?env.STRIPE_ANNUAL_PRICE_ID:input.interval==='monthly'?env.STRIPE_MONTHLY_PRICE_ID:null;
    if (!price || !/^price_/.test(price)) return json({error:'Test billing 尚未設定'},503);
    const params=new URLSearchParams({mode:'subscription','line_items[0][price]':price,'line_items[0][quantity]':'1',client_reference_id:member.id,success_url:`${url.origin}/learn/dewatering/?checkout=return`,cancel_url:`${url.origin}/learn/dewatering/?checkout=cancel`});
    if (member.stripe_customer_id) params.set('customer',member.stripe_customer_id); else params.set('customer_email',member.email);
    const session=await stripe(env,'checkout/sessions',params);
    return session ? json({url:session.url}) : json({error:'Test billing 尚未設定'},503);
  }
  if (path === '/api/learn/billing-portal') {
    if (!member.stripe_customer_id) return json({error:'未有 Stripe 訂閱'},409);
    const portal=await stripe(env,'billing_portal/sessions',new URLSearchParams({customer:member.stripe_customer_id,return_url:`${url.origin}/learn/dewatering/`}));
    return portal ? json({url:portal.url}) : json({error:'Test billing 尚未設定'},503);
  }
  return json({error:'Not found'},404);
}
