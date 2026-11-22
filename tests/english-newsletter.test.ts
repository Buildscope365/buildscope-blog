import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.ts';
const origin='https://buildscope-blog.com';
const env={CMS_ORIGIN:origin,BREVO_EN_API_KEY:'test-server-secret',BREVO_EN_LIST_ID:'123',BREVO_EN_DOI_TEMPLATE_ID:'456',ASSETS:{fetch:async()=>new Response('asset')}} as any;
const post=(data:unknown,requestOrigin=origin)=>new Request(`${origin}/api/en/newsletter`,{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('Preview disables administrative and API routes while serving English pages',async()=>{
  const preview={...env,PREVIEW_MODE:'true'};
  for(const path of ['/admin/','/auth','/callback','/api/en/newsletter','/api/instagram/publish']){
    const response=await worker.fetch(new Request(`${origin}${path}`),preview);
    assert.equal(response.status,404,path);
  }
  assert.equal((await worker.fetch(new Request(`${origin}/en/`),preview)).status,200);
});
test('English signup rejects cross-origin requests and unavailable configuration',async()=>{
  assert.equal((await worker.fetch(post({email:'someone@example.com',consent:true},'https://other.test'),env)).status,403);
  assert.equal((await worker.fetch(post({email:'someone@example.com',consent:true}),{...env,BREVO_EN_LIST_ID:undefined})).status,503);
});
test('English signup requires valid address and explicit consent',async()=>{
  assert.equal((await worker.fetch(post({email:'bad',consent:true}),env)).status,400);
  assert.equal((await worker.fetch(post({email:'someone@example.com',consent:false}),env)).status,400);
});
test('English signup uses only dedicated list and DOI template without exposing key',async()=>{
  const previous=globalThis.fetch;let url='';let options:RequestInit|undefined;
  globalThis.fetch=async(input,init)=>{url=String(input);options=init;return new Response('{}',{status:201})};
  try{const response=await worker.fetch(post({email:'someone@example.com',consent:true}),env);assert.equal(response.status,200);assert.match(url,/contacts\/doubleOptinConfirmation/);const payload=JSON.parse(String(options?.body));assert.deepEqual(payload.includeListIds,[123]);assert.equal(payload.templateId,456);assert.equal(payload.email,'someone@example.com');assert.doesNotMatch(await response.text(),/test-server-secret|123|456/)}finally{globalThis.fetch=previous}
});
