import assert from 'node:assert/strict';

const base=process.env.LEARNING_WORKER_URL||'http://127.0.0.1:8787';
const request=async(path,options)=>fetch(`${base}${path}`,options);
const response=await request('/api/learn/lessons');
assert.equal(response.status,200);
const listing=await response.json();
assert.equal(listing.lessons.length,9);
assert.ok(listing.lessons.every(lesson=>lesson.ready===false));

assert.equal((await request('/api/learn/lesson?id=basics')).status,401);
assert.equal((await request('/api/learn/media/lesson-1.webp')).status,401);
const registration=await request('/api/learn/register',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({email:'pilot@example.com',password:'test-password-long'})});
assert.equal(registration.status,503);
assert.equal((await request('/api/learn/me')).status,200);
console.log('Learning Worker with local D1/R2: outline, unpublished state and member protection verified.');
