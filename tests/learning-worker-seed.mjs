import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';

const token='a'.repeat(64);
const tokenHash=createHash('sha256').update(token).digest('hex');
const browserTokenHash=createHash('sha256').update('b'.repeat(64)).digest('hex');
const expires=Math.floor(Date.now()/1000)+3600;
const ids=['basics','systems','drawdown','settlement','failures','quick-check'];
const sql=`INSERT INTO members(id,email,salt,password_hash,verified_at) VALUES('member-ci','pilot@example.com','seed','not-a-usable-password',1);
INSERT INTO sessions(token_hash,member_id,expires_at) VALUES('${tokenHash}','member-ci',${expires});
INSERT INTO members(id,email,salt,password_hash,verified_at) VALUES('member-browser','browser@example.com','seed','not-a-usable-password',1);
INSERT INTO sessions(token_hash,member_id,expires_at) VALUES('${browserTokenHash}','member-browser',${expires});
${ids.map(id=>`INSERT INTO lesson_content(course_id,lesson_id,body,published) VALUES('dewatering','${id}','CI synthetic lesson, no paid content',1);`).join('\n')}`;
await writeFile('/tmp/buildscope-learning-fixture.sql',sql);
