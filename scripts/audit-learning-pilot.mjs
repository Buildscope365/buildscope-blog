import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = resolve(fileURLToPath(new URL('..', import.meta.url)));
const expected = ['positioning','basics','systems','drawdown','settlement','failures','quick-check'];
const [contentPath, mediaDirectory, pdfPath] = process.argv.slice(2);
if (![contentPath,mediaDirectory,pdfPath].every(path=>path && isAbsolute(path))) {
  console.error('Usage: node scripts/audit-learning-pilot.mjs /absolute/private/course.json /absolute/private/media /absolute/private/checklist.pdf');
  process.exit(2);
}
const outsideRepository = path => { const relativePath=relative(repository,resolve(path));return relativePath==='..'||relativePath.startsWith(`..${process.platform==='win32'?'\\':'/'}`); };
const findings=[];
const check=(condition,message)=>{findings.push({passed:Boolean(condition),message});};
check([contentPath,mediaDirectory,pdfPath].every(outsideRepository),'All paid source files are outside the public repository');

const data=JSON.parse(await readFile(contentPath,'utf8'));
check(data.courseId==='dewatering' && Array.isArray(data.lessons) && expected.every((id,index)=>data.lessons[index]?.id===id) && data.lessons.length===7,'Exactly seven teaching units in the approved course order');
check(data.status?.startsWith('unpublished') && data.lessons?.every(item=>typeof item.body==='string' && item.body.length>500),'Text is substantive and explicitly unpublished');
check(data.lessons?.every(item=>!item.body.includes('images.openai.com')),'Third-party image proxy URLs are excluded');
const questions=data.lessons?.find(item=>item.id==='quick-check')?.body.match(/^[①②③④⑤] /gm)||[];
check(questions.length===5,'Five site questions survive the editorial import');

const names=await readdir(mediaDirectory);
check(expected.slice(1).every((_,index)=>names.includes(`lesson-${index+1}.webp`)),'Six private lesson WebPs are present');
const manifest=JSON.parse(await readFile(join(mediaDirectory,'manifest.json'),'utf8'));
check(Array.isArray(manifest) && manifest.length===7 && manifest.some(item=>item.file==='course-cover.webp'),'Private media manifest has six lessons and one course cover');
for (let index=1;index<=6;index++) {
  const buffer=await readFile(join(mediaDirectory,`lesson-${index}.webp`));
  check(buffer.length>100_000 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP',`Lesson ${index} private WebP has a valid header and substantial size`);
  const entry=manifest.find(item=>item.file===`lesson-${index}.webp`);
  check(entry?.r2_key===`dewatering/lesson-${index}.webp` && entry.sha256===createHash('sha256').update(buffer).digest('hex'),`Lesson ${index} matches its private R2 manifest SHA-256`);
}
const pdf=await readFile(pdfPath);
check(pdf.subarray(0,4).toString()==='%PDF' && pdf.length>10_000,'Private checklist draft is a readable PDF file');
check(!/draft/i.test(pdfPath),'Checklist filename no longer carries draft status');

const publicDirectory=join(repository,'public','images','learning','dewatering');
const publicFiles=await readdir(publicDirectory);
check(publicFiles.includes('course-cover.webp') && publicFiles.every(name=>name==='course-cover.webp'),'Only the course cover is in public learning assets');
for (const path of [join(repository,'public','dewatering','resource-checklist.pdf'),join(repository,'dist','dewatering','resource-checklist.pdf')]) {
  check(!(await stat(path).catch(()=>null)),'No paid PDF exists at a public static path');
}

for(const item of findings) console.log(`${item.passed?'PASS':'FAIL'} ${item.message}`);
console.log(`${findings.filter(item=>item.passed).length}/${findings.length} local asset checks passed.`);
console.log('RELEASE NO-GO until editorial approval (including Lesson 5 art), isolated D1/R2 preview, real email, Stripe test lifecycle, and Skool eligibility review are verified.');
if (findings.some(item=>!item.passed)) process.exitCode=1;
