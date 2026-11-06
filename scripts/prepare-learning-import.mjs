import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
const repository = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ids = ['positioning', 'basics', 'systems', 'drawdown', 'settlement', 'failures', 'quick-check'];
const quote = value => `'${value.replaceAll("'", "''")}'`;
export function buildImportSql(data) {
  if (data.courseId !== 'dewatering' || !Array.isArray(data.lessons) || data.lessons.length !== ids.length || ids.some((id,i) => data.lessons[i]?.id !== id || typeof data.lessons[i]?.body !== 'string' || data.lessons[i].body.length < 100)) throw new Error('Expected seven complete Dewatering units in course order');
  return 'BEGIN TRANSACTION;\n' + data.lessons.map(({id,body}) => `INSERT INTO lesson_content(course_id,lesson_id,body,published) VALUES('dewatering',${quote(id)},${quote(body)},0) ON CONFLICT(course_id,lesson_id) DO UPDATE SET body=excluded.body,published=0;`).join('\n') + '\nCOMMIT;\n';
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source,target] = process.argv.slice(2);
  if (!source || !target || !isAbsolute(source) || !isAbsolute(target)) throw new Error('Pass absolute source JSON and output SQL paths');
  const rel = relative(repository,resolve(target));
  if (!rel.startsWith('..') || rel === '') throw new Error('Private SQL output must be outside the public repository');
  const data = JSON.parse(await readFile(source,'utf8'));
  await writeFile(target,buildImportSql(data),{mode:0o600,flag:'wx'});
  process.stdout.write(`Prepared ${data.lessons.length} unpublished lessons outside the repository.\n`);
}
