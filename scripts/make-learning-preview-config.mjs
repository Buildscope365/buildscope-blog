import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const templatePath = new URL('../wrangler.learning-preview.example.jsonc', import.meta.url);
const outputPath = new URL('../.wrangler.learning-preview.jsonc', import.meta.url);

const databaseId = process.env.LEARNING_TEST_D1_ID || '';
const previewOrigin = process.env.LEARNING_PREVIEW_ORIGIN || '';

if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(databaseId)) {
  throw new Error('LEARNING_TEST_D1_ID must be a test D1 database ID.');
}

let origin;
try { origin = new URL(previewOrigin); } catch { throw new Error('LEARNING_PREVIEW_ORIGIN must be a valid HTTPS URL.'); }
if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.workers.dev') || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('LEARNING_PREVIEW_ORIGIN must be a workers.dev origin, never the production domain.');
}

const config = JSON.parse(await readFile(templatePath, 'utf8'));
if (config.name !== 'buildscope-learning-preview' || config.d1_databases?.[0]?.database_name !== 'buildscope-learning-test' || config.r2_buckets?.[0]?.bucket_name !== 'buildscope-learning-media-test') {
  throw new Error('Preview template resources changed; review them before generating a configuration.');
}
config.d1_databases[0].database_id = databaseId;
config.vars.CMS_ORIGIN = origin.origin;
await writeFile(outputPath, JSON.stringify(config, null, 2) + '\n', { mode: 0o600, flag: 'w' });
console.log(`Generated ignored preview config in ${repoRoot}; Worker name: ${config.name}.`);
