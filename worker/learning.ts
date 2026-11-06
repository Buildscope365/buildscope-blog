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

type LearningEnv = Env & { LEARNING_DB?: D1Database; LEARNING_MEDIA?: R2Bucket; STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string; STRIPE_MONTHLY_PRICE_ID?: string; STRIPE_ANNUAL_PRICE_ID?: string; LEARNING_ADMIN_TOKEN?: string; BREVO_API_KEY?: string; LEARNING_EMAIL_FROM?: string; ASSETS: Fetcher };
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
  return db.prepare('SELECT m.id, m.email, m.stripe_customer_id FROM sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at>? AND m.verified_at IS NOT NULL').bind(await sha(token), Math.floor(Date.now()/1000)).first<{id:string;email:string;stripe_customer_id:string|null}>();
};
const requireOrigin = (request: Request) => { const origin = request.headers.get('Origin'); return origin === new URL(request.url).origin; };
const body = async (request: Request) => request.json().catch(() => ({})) as Promise<Record<string, unknown>>;
const cookie = (token: string, age = 60*60*24*14) => `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const emailReady = (env: LearningEnv) => Boolean(env.BREVO_API_KEY && env.LEARNING_EMAIL_FROM && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.LEARNING_EMAIL_FROM));
const sendAccountEmail = async (env: LearningEnv, email: string, link: string, purpose: 'verify'|'reset') => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {method:'POST',headers:{'api-key':env.BREVO_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({sender:{email:env.LEARNING_EMAIL_FROM,name:'BuildScope Learning Centre'},to:[{email}],subject:purpose==='verify'?'驗證 BuildScope 網站帳戶':'重設 BuildScope 網站密碼',textContent:`請在一小時內開啟以下連結：\n${link}\n\n如非你本人操作，請忽略此電郵。`})});
  return response.ok;
};
const sendAccountToken = async (db: D1Database, env: LearningEnv, memberId: string, email: string, purpose: 'verify'|'reset', origin: string) => {
  const token=random(), tokenHash=await sha(token);
  await db.prepare('DELETE FROM account_tokens WHERE member_id=? AND purpose=?').bind(memberId,purpose).run();
  await db.prepare('INSERT INTO account_tokens(token_hash,member_id,purpose,expires_at) VALUES(?,?,?,?)').bind(tokenHash,memberId,purpose,Math.floor(Date.now()/1000)+3600).run();
  const link=`${origin}/learn/dewatering/#${purpose}=${token}`;
  if (!(await sendAccountEmail(env,email,link,purpose))) {
    await db.prepare('DELETE FROM account_tokens WHERE token_hash=?').bind(tokenHash).run();
    return false;
  }
  return true;
};
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
    if (await db.prepare('SELECT 1 FROM stripe_events WHERE id=?').bind(event.id).first()) return json({received:true,duplicate:true});
    const object = event.data.object;
    // Associate only the member ID stored by our own Checkout session, never an email claim.
    if (event.type === 'checkout.session.completed' && object.mode === 'subscription' && object.client_reference_id && object.customer) {
      const known=await db.prepare('SELECT member_id FROM checkout_sessions WHERE stripe_session_id=? AND member_id=?').bind(object.id,object.client_reference_id).first();
      if (known) {
        await db.prepare('UPDATE members SET stripe_customer_id=? WHERE id=? AND (stripe_customer_id IS NULL OR stripe_customer_id=?)').bind(object.customer,object.client_reference_id,object.customer).run();
        if (typeof object.subscription==='string') await db.prepare('UPDATE checkout_sessions SET stripe_subscription_id=? WHERE stripe_session_id=? AND member_id=?').bind(object.subscription,object.id,object.client_reference_id).run();
      }
    }
    const subscriptionId=event.type==='checkout.session.completed' ? object.subscription : event.type.startsWith('customer.subscription.') ? object.id : null;
    if (subscriptionId) {
      // Reconcile current Stripe state; webhooks may arrive out of order.
      const response=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Stripe-Version':'2026-02-25.clover'}});
      if (!response.ok) return json({error:'Stripe reconciliation failed'},502);
      const current=await response.json() as {id:string;customer:string;status:string;current_period_end?:number;items?:{data?:Array<{current_period_end?:number;price?:{id:string}}>}};
      const member=await db.prepare('SELECT id FROM members WHERE stripe_customer_id=?').bind(current.customer).first<{id:string}>();
      if (!member) return json({error:'Unmatched customer; retry later'},503);
      const checkout=await db.prepare('SELECT price_id FROM checkout_sessions WHERE stripe_subscription_id=? AND member_id=?').bind(current.id,member.id).first<{price_id:string}>();
      if (!checkout) return json({error:'Unknown subscription; retry later'},503);
      const configuredPrices=[env.STRIPE_MONTHLY_PRICE_ID,env.STRIPE_ANNUAL_PRICE_ID];
      const eligibleItem=current.items?.data?.find(item=>item.price?.id===checkout.price_id && configuredPrices.includes(item.price.id));
      const periodEnd=eligibleItem?.current_period_end||0;
      await db.batch([
        db.prepare('INSERT INTO subscriptions(stripe_subscription_id,member_id,status,period_end,last_event_created) VALUES(?,?,?,?,?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=excluded.status,period_end=excluded.period_end,last_event_created=excluded.last_event_created WHERE excluded.last_event_created>=subscriptions.last_event_created').bind(current.id,member.id,eligibleItem?current.status:'ineligible',periodEnd,Math.floor(Date.now()/1000)),
        db.prepare('INSERT OR IGNORE INTO stripe_events(id) VALUES(?)').bind(event.id),
      ]);
    }
    return json({received:true});
  }
  if (['/api/learn/verify','/api/learn/request-reset','/api/learn/reset-password','/api/learn/resend-verification'].includes(path)) {
    if (request.method !== 'POST' || !requireOrigin(request)) return json({error:'Invalid request'},403);
    const input=await body(request);
    if (path==='/api/learn/verify' || path==='/api/learn/reset-password') {
      const token=String(input.token||'');
      if (!/^[a-f0-9]{64}$/.test(token)) return json({error:'連結無效或已過期'},400);
      const purpose=path.endsWith('/verify')?'verify':'reset';
      const found=await db.prepare('SELECT member_id FROM account_tokens WHERE token_hash=? AND purpose=? AND expires_at>?').bind(await sha(token),purpose,Math.floor(Date.now()/1000)).first<{member_id:string}>();
      if (!found) return json({error:'連結無效或已過期'},400);
      if (purpose==='verify') {
        await db.batch([db.prepare('UPDATE members SET verified_at=? WHERE id=?').bind(Math.floor(Date.now()/1000),found.member_id),db.prepare('DELETE FROM account_tokens WHERE member_id=? AND purpose=?').bind(found.member_id,purpose)]);
      } else {
        const password=String(input.password||'');
        if (password.length<12 || password.length>256) return json({error:'密碼須有 12 至 256 字元'},400);
        const salt=random();
        await db.batch([db.prepare('UPDATE members SET salt=?,password_hash=?,failed_attempts=0,locked_until=0 WHERE id=?').bind(salt,await passwordHash(password,salt),found.member_id),db.prepare('DELETE FROM sessions WHERE member_id=?').bind(found.member_id),db.prepare('DELETE FROM account_tokens WHERE member_id=? AND purpose=?').bind(found.member_id,purpose)]);
      }
      return json({ok:true});
    }
    if (!emailReady(env)) return json({error:'電郵服務尚未設定'},503);
    const email=String(input.email||'').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'請輸入有效電郵'},400);
    const member=await db.prepare('SELECT id,verified_at FROM members WHERE email=?').bind(email).first<{id:string;verified_at:number|null}>();
    const purpose=path.endsWith('/request-reset')?'reset':'verify';
    if (member && (purpose==='reset' ? Boolean(member.verified_at) : !member.verified_at)) {
      if (!(await sendAccountToken(db,env,member.id,email,purpose,url.origin))) return json({error:'電郵未能送出，請稍後再試'},502);
    }
    return json({ok:true,message:'如帳戶符合條件，請檢查電郵。'});
  }
  if (path === '/api/learn/register' || path === '/api/learn/login') {
    if (request.method !== 'POST' || !requireOrigin(request)) return json({error:'Invalid request'},403);
    const input = await body(request), email = String(input.email||'').trim().toLowerCase(), password = String(input.password||'');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length<12 || password.length>256) return json({error:'請輸入有效電郵及至少 12 字元密碼'},400);
    let member = await db.prepare('SELECT id,salt,password_hash,failed_attempts,locked_until,verified_at FROM members WHERE email=?').bind(email).first<{id:string;salt:string;password_hash:string;failed_attempts:number;locked_until:number;verified_at:number|null}>();
    if (path.endsWith('register')) {
      if (!emailReady(env)) return json({error:'電郵驗證尚未設定，暫停新帳戶登記'},503);
      if (member) return json({error:'此電郵已登記'},409);
      const id = crypto.randomUUID(), salt = random();
      await db.prepare('INSERT INTO members(id,email,salt,password_hash) VALUES(?,?,?,?)').bind(id,email,salt,await passwordHash(password,salt)).run();
      if (!(await sendAccountToken(db,env,id,email,'verify',url.origin))) return json({error:'驗證電郵未能送出；稍後可要求重發'},502);
      return json({ok:true,message:'請先查看驗證電郵，再登入。'});
    } else {
      if (member?.locked_until && member.locked_until>Date.now()/1000) return json({error:'請稍後再試'},429);
      const check = await passwordHash(password,member?.salt||random());
      if (!member || !equal(check,member.password_hash)) {
        if (member) await db.prepare('UPDATE members SET failed_attempts=failed_attempts+1,locked_until=CASE WHEN failed_attempts>=4 THEN ? ELSE 0 END WHERE id=?').bind(Math.floor(Date.now()/1000)+900,member.id).run();
        return json({error:'電郵或密碼不正確'},401);
      }
      if (!member.verified_at) return json({error:'請先完成電郵驗證'},403);
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
  if (path.startsWith('/api/learn/media/')) {
    if (request.method !== 'GET') return json({error:'Method not allowed'},405);
    const match=/^\/api\/learn\/media\/lesson-([1-6])\.webp$/.exec(path);
    if (!match) return json({error:'Not found'},404);
    if (!member) return json({error:'請先登入'},401);
    if (!(await entitlement(db,member.id))) return json({error:'會員課堂需先開通'},403);
    const id=lessons[Number(match[1])][0];
    if (!(await db.prepare('SELECT 1 FROM lesson_content WHERE course_id=? AND lesson_id=? AND published=1').bind(course,id).first())) return json({error:'課堂尚未發布'},404);
    if (!env.LEARNING_MEDIA) return json({error:'Private media 尚未設定'},503);
    const object=await env.LEARNING_MEDIA.get(`dewatering/lesson-${match[1]}.webp`);
    if (!object) return json({error:'Image not found'},404);
    return new Response(object.body,{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'}});
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
    if (!reference || reference.length>200 || !(await db.prepare('SELECT 1 FROM members WHERE id=? AND verified_at IS NOT NULL').bind(id).first())) return json({error:'Invalid verified member'},400);
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
    if (session) await db.prepare('INSERT INTO checkout_sessions(stripe_session_id,member_id,price_id,created_at) VALUES(?,?,?,?)').bind(session.id,member.id,price,Math.floor(Date.now()/1000)).run();
    return session ? json({url:session.url}) : json({error:'Test billing 尚未設定'},503);
  }
  if (path === '/api/learn/billing-portal') {
    if (!member.stripe_customer_id) return json({error:'未有 Stripe 訂閱'},409);
    const portal=await stripe(env,'billing_portal/sessions',new URLSearchParams({customer:member.stripe_customer_id,return_url:`${url.origin}/learn/dewatering/`}));
    return portal ? json({url:portal.url}) : json({error:'Test billing 尚未設定'},503);
  }
  return json({error:'Not found'},404);
}
