import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {learning} from '../worker/learning.ts';

test('email ownership, login, reset, and old-session invalidation', async () => {
  type Member={id:string;email:string;salt:string;password_hash:string;verified_at:number|null;failed_attempts:number;locked_until:number;stripe_customer_id:null};
  const members=new Map<string,Member>(),tokens=new Map<string,{member_id:string;purpose:string;expires_at:number}>(),sessions=new Map<string,string>();
  const db={
    prepare:(sql:string)=>({bind:(...args:any[])=>({
      first:async()=>{
        if(sql.includes('FROM members WHERE email=')) return members.get(args[0])??null;
        if(sql.includes('FROM account_tokens')) {const value=tokens.get(args[0]);return value&&value.purpose===args[1]&&value.expires_at>args[2]?value:null;}
        if(sql.includes('FROM sessions')) {const memberId=sessions.get(args[0]);const member=[...members.values()].find(x=>x.id===memberId);return member?.verified_at?member:null;}
        throw Error(`Unexpected read: ${sql}`);
      },
      run:async()=>{
        if(sql.startsWith('INSERT INTO members')) members.set(args[1],{id:args[0],email:args[1],salt:args[2],password_hash:args[3],verified_at:null,failed_attempts:0,locked_until:0,stripe_customer_id:null});
        else if(sql.startsWith('DELETE FROM account_tokens WHERE member_id')) {for(const [key,value] of tokens) if(value.member_id===args[0]&&value.purpose===args[1]) tokens.delete(key);}
        else if(sql.startsWith('DELETE FROM account_tokens WHERE token_hash')) tokens.delete(args[0]);
        else if(sql.startsWith('INSERT INTO account_tokens')) tokens.set(args[0],{member_id:args[1],purpose:args[2],expires_at:args[3]});
        else if(sql.startsWith('UPDATE members SET verified_at')) [...members.values()].find(x=>x.id===args[1])!.verified_at=args[0];
        else if(sql.startsWith('UPDATE members SET salt=')) {const member=[...members.values()].find(x=>x.id===args[2])!;member.salt=args[0];member.password_hash=args[1];member.failed_attempts=0;}
        else if(sql.startsWith('UPDATE members SET failed_attempts=0')) {const member=[...members.values()].find(x=>x.id===args[0])!;member.failed_attempts=0;member.locked_until=0;}
        else if(sql.startsWith('UPDATE members SET failed_attempts=failed_attempts+1')) {const member=[...members.values()].find(x=>x.id===args[1])!;member.failed_attempts++;}
        else if(sql.startsWith('INSERT INTO sessions')) sessions.set(args[0],args[1]);
        else if(sql.startsWith('DELETE FROM sessions WHERE member_id')) {for(const [key,value] of sessions) if(value===args[0]) sessions.delete(key);}
        else throw Error(`Unexpected write: ${sql}`);
      },
    })}),
    batch:async(statements:Array<{run:()=>Promise<void>}>)=>{for(const statement of statements) await statement.run();},
  };
  const emails:string[]=[];
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(_url,options)=>{const payload=JSON.parse(String(options?.body));emails.push(payload.textContent);return new Response(JSON.stringify({messageId:'ci'}),{status:201});};
  const env={LEARNING_DB:db,BREVO_API_KEY:'test-only',LEARNING_EMAIL_FROM:'learning@example.com'} as never;
  const post=(path:string,data:object)=>learning(new Request(`https://example.com/api/learn/${path}`,{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(data)}),env);
  const extractToken=()=>emails.at(-1)?.match(/#(?:verify|reset)=([a-f0-9]{64})/)?.[1];
  try {
    const email='pilot@example.com',password='original-long-password';
    const register=await post('register',{email,password});
    assert.equal(register.status,200);
    assert.equal(register.headers.get('Set-Cookie'),null,'registration must not create a session');
    assert.equal((await post('login',{email,password})).status,403,'unverified email cannot log in');
    const verifyToken=extractToken();assert.ok(verifyToken);assert.equal(tokens.size,1,'registration should leave a verification token');
    assert.equal((await post('verify',{token:verifyToken})).status,200);
    assert.equal((await post('verify',{token:verifyToken})).status,400,'verification token is single-use');
    const login=await post('login',{email,password});assert.equal(login.status,200);
    const sessionCookie=login.headers.get('Set-Cookie')!.split(';')[0];
    const originalSession=sessionCookie.split('=')[1];
    assert.equal(sessions.get(createHash('sha256').update(originalSession).digest('hex')),members.get(email)!.id);
    assert.equal((await post('request-reset',{email})).status,200);
    const resetToken=extractToken();assert.ok(resetToken);
    assert.equal((await post('reset-password',{token:resetToken,password:'replacement-long-password'})).status,200);
    assert.equal(sessions.size,0,'password reset invalidates sessions');
    assert.equal((await post('reset-password',{token:resetToken,password:'another-long-password'})).status,400,'reset token is single-use');
    assert.equal((await post('login',{email,password})).status,401);
    assert.equal((await post('login',{email,password:'replacement-long-password'})).status,200);
  } finally {globalThis.fetch=originalFetch;}
});
