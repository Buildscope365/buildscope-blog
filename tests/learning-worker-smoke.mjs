import assert from 'node:assert/strict';

const base=process.env.LEARNING_WORKER_URL||'http://127.0.0.1:8787';
const request=async(path,options)=>fetch(`${base}${path}`,options);
const response=await request('/api/learn/lessons');
assert.equal(response.status,200);
const listing=await response.json();
assert.equal(listing.lessons.length,9);
assert.equal(listing.lessons.filter(lesson=>lesson.ready).length,6);
assert.equal(listing.lessons.find(lesson=>lesson.id==='basics').ready,true);
assert.equal(listing.lessons.find(lesson=>lesson.id==='completion').ready,false);

assert.equal((await request('/api/learn/lesson?id=basics')).status,401);
assert.equal((await request('/api/learn/media/lesson-1.webp')).status,401);
const registration=await request('/api/learn/register',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({email:'pilot@example.com',password:'test-password-long'})});
assert.equal(registration.status,503);
assert.equal((await request('/api/learn/me')).status,200);
const memberHeaders={cookie:`bs_member=${'a'.repeat(64)}`};
assert.equal((await request('/api/learn/lesson?id=basics',{headers:memberHeaders})).status,403);
const admin=async(path,authorization='Bearer ci_admin_token',origin=null)=>request(`/api/learn/admin/${path}`,{method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({memberId:'member-ci',skoolReference:'ci-verification-001'})});
assert.equal((await admin('grant','Bearer wrong_token')).status,401);
assert.equal((await admin('grant','Bearer ci_admin_token','https://other.example')).status,403);
assert.equal((await admin('grant')).status,200);
assert.equal((await admin('grant')).status,200);
assert.equal((await request('/api/learn/lesson?id=completion',{headers:memberHeaders})).status,403);
const paid=await request('/api/learn/lesson?id=basics',{headers:memberHeaders});
assert.equal(paid.status,200);
assert.equal((await paid.json()).body,'CI synthetic lesson, no paid content');
for(let i=1;i<=6;i++) {
  const media=await request(`/api/learn/media/lesson-${i}.webp`,{headers:memberHeaders});
  assert.equal(media.status,200);
  assert.equal(media.headers.get('Content-Type'),'image/webp');
  assert.equal(media.headers.get('Cache-Control'),'private, no-store');
}
for(const id of ['basics','systems','drawdown','settlement','failures','quick-check']) {
  assert.equal((await request('/api/learn/progress',{method:'POST',headers:{...memberHeaders,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({id})})).status,200);
}
assert.equal((await request('/api/learn/lesson?id=completion',{headers:memberHeaders})).status,200);
const finished=await (await request('/api/learn/lessons',{headers:memberHeaders})).json();
assert.equal(finished.lessons.find(lesson=>lesson.id==='completion').ready,true);
assert.equal(finished.lessons.find(lesson=>lesson.id==='resource').ready,false);
assert.equal((await request('/api/learn/progress',{method:'POST',headers:{...memberHeaders,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({id:'resource'})})).status,400);
assert.equal((await admin('revoke')).status,200);
assert.equal((await request('/api/learn/lesson?id=basics',{headers:memberHeaders})).status,403);
console.log('Learning Worker with local D1/R2: access, six-lesson completion and idempotent Skool grant/revocation verified.');
