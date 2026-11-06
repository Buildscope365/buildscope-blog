import assert from 'node:assert/strict';

const base=process.env.LEARNING_WORKER_URL||'http://127.0.0.1:8787';
const request=async(path,options)=>fetch(`${base}${path}`,options);
const response=await request('/api/learn/lessons');
assert.equal(response.status,200);
const listing=await response.json();
assert.equal(listing.lessons.length,9);
assert.equal(listing.lessons.filter(lesson=>lesson.ready).length,1);
assert.equal(listing.lessons.find(lesson=>lesson.id==='basics').ready,true);

assert.equal((await request('/api/learn/lesson?id=basics')).status,401);
assert.equal((await request('/api/learn/media/lesson-1.webp')).status,401);
const registration=await request('/api/learn/register',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({email:'pilot@example.com',password:'test-password-long'})});
assert.equal(registration.status,503);
assert.equal((await request('/api/learn/me')).status,200);
const memberHeaders={cookie:`bs_member=${'a'.repeat(64)}`};
assert.equal((await request('/api/learn/lesson?id=basics',{headers:memberHeaders})).status,403);
const admin=async(path)=>request(`/api/learn/admin/${path}`,{method:'POST',headers:{...memberHeaders,Origin:base,Authorization:'Bearer ci_admin_token','Content-Type':'application/json'},body:JSON.stringify({memberId:'member-ci',skoolReference:'ci-verification-001'})});
assert.equal((await admin('grant')).status,200);
assert.equal((await admin('grant')).status,200);
const paid=await request('/api/learn/lesson?id=basics',{headers:memberHeaders});
assert.equal(paid.status,200);
assert.equal((await paid.json()).body,'CI synthetic lesson, no paid content');
assert.equal((await request('/api/learn/progress',{method:'POST',headers:{...memberHeaders,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({id:'basics'})})).status,200);
assert.equal((await admin('revoke')).status,200);
assert.equal((await request('/api/learn/lesson?id=basics',{headers:memberHeaders})).status,403);
console.log('Learning Worker with local D1/R2: access, progress and idempotent Skool grant/revocation verified.');
