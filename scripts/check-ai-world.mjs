import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {sessions,photos} from './ai-world-content.mjs';
import {matchesSession} from '../activities/ai-world-2026/archive.js';

assert.equal(sessions.length,21);
assert.equal(new Set(sessions.map(s=>s.id)).size,21);
assert.equal(sessions.filter(s=>s.pdf).length,13);
assert.equal(new Set(photos.map(p=>p[0])).size,18);
assert.equal(matchesSession('윤송이 Principal Venture Partners 규제', 'industry', false, '윤송이 규제','all'),true);
assert.equal(matchesSession('윤송이', 'industry', false, '윤송이'.normalize('NFD'),'all'),true);
assert.equal(matchesSession('AI 정책', 'trust', false, '', 'trust'),true);
assert.equal(matchesSession('SK 텔레콤', 'trust', false, 'SK텔레콤', 'all'),true);
assert.equal(matchesSession('박용권 당근', 'work', true, '당근', 'pdf'),true);
assert.equal(matchesSession('윤송이', 'industry', false, '', 'pdf'),false);
assert.equal(matchesSession('KT', 'work', true, '미존재검색어', 'all'),false);
assert.equal(matchesSession('KT', 'work', true, '', 'trust'),false);
const html = await readFile(new URL('../activities/ai-world-2026/index.html',import.meta.url),'utf8');
assert.equal((html.match(/data-session /g)||[]).length,21);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate DOM IDs');
for (const [,href] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(href),`Missing anchor ${href}`);
for (const s of sessions) {
  assert.equal(s.points.length,3);
  if(s.pdf) assert(['www.ai-world.kr','event.fnnews.com'].includes(new URL(s.pdf).hostname));
}
const assets = new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+|\.\/(?:archive\.css|archive\.js))/g)].map(m=>m[1]));
for (const file of assets) await access(new URL(file.startsWith('/assets/')?`..${file}`:`../activities/ai-world-2026/${file}`,import.meta.url));
for (const [id] of photos) for(const width of [720,1600]) await access(new URL(`../assets/ai-world-2026/field-${id}-${width}.webp`,import.meta.url));
console.log('PASS: content counts, filters, Korean normalization, anchors, local assets and official download hosts.');
