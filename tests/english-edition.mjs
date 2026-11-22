import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const dist=new URL('../dist/',import.meta.url);
const html=async path=>readFile(new URL(path,dist),'utf8');
const english=['en/','en/pocket-library/','en/ebooks/','en/insights/','en/resources/','en/about/'];
for(const route of english){const page=await html(`${route}index.html`);assert.match(page,/<html lang="en-GB">/);assert.match(page,/og:locale" content="en_GB"/);assert.match(page,/rel="canonical" href="https:\/\/buildscope-blog.com\/en\//);assert.doesNotMatch(page,/href="\/(?:blog|learning-lab|pocket-guides|visual-library|comics|tools)\//);assert.doesNotMatch(page,/Language Switcher|繁體中文|學習體驗/);}
const home=await html('en/index.html');assert.match(home,/Construction knowledge/);assert.match(home,/No email addresses are collected on this page yet/);assert.doesNotMatch(home,/gumroad\.com|type="email"/);
assert.match(home,/construction-structure\.webp/);
const insight=await html('en/insights/reading-construction-drawings/index.html');assert.match(insight,/Before you build/);assert.match(insight,/BreadcrumbList/);
const resource=await html('en/resources/drawing-review-checklist/index.html');assert.match(resource,/drawing register/);assert.doesNotMatch(resource,/Download resource/);
const sitemap=await readFile(new URL('sitemap.xml',dist),'utf8');for(const route of [...english,'en/insights/reading-construction-drawings/','en/resources/drawing-review-checklist/'])assert.ok(sitemap.includes(`https://buildscope-blog.com/${route}`));assert.ok(!sitemap.includes('en/pocket-library/example'));
const chinese=await html('index.html');assert.match(chinese,/<html lang="zh-Hant">/);assert.doesNotMatch(chinese,/href="\/en\//);assert.match(sitemap,/https:\/\/buildscope-blog.com\/visual-library\//);
for(const route of english)await access(new URL(`${route}index.html`,dist));
const assets=await readdir(new URL('images/en/',dist));assert.ok(assets.includes('architectural-grid.svg'));
assert.ok(assets.includes('construction-structure.webp'));
const routes=[...english,'en/insights/reading-construction-drawings/','en/resources/drawing-review-checklist/'];
for(const route of routes){
  const page=await html(`${route}index.html`);
  for(const match of page.matchAll(/(?:href|src)="(\/[^"]+)"/g)){
    const path=match[1].split(/[?#]/)[0];
    if(!path||path==='/')continue;
    const target=path.endsWith('/')?`${path.slice(1)}index.html`:path.slice(1);
    await assert.doesNotReject(access(new URL(target,dist)),`Broken link or image on ${route}: ${path}`);
  }
}
console.log('English edition: routes, content isolation, SEO, draft visibility, assets and Chinese homepage passed');
