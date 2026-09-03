// C12 — setiap page/route/generateMetadata yang menerima params/searchParams harus meng-await-nya (Next 16).
import { readFileSync } from 'node:fs'; import { globSync } from 'node:fs';
const berkas = [...globSync('app/**/*.js'), 'proxy.js'];
let masalah = 0, diperiksa = 0;
for (const f of berkas) {
  const s = readFileSync(f, 'utf8');
  const pakaiParams = /\bparams\b/.test(s), pakaiSP = /\bsearchParams\b/.test(s);
  const pakaiCookies = /\bcookies\(\)/.test(s), pakaiHeaders = /\bheaders\(\)/.test(s);
  if (!pakaiParams && !pakaiSP && !pakaiCookies && !pakaiHeaders) continue;
  diperiksa++;
  const catatan = [];
  if (pakaiParams && !/await\s+(konteks\.|ctx\.|konteks\?\.)?params\b|await\s+props\.params|const\s*{[^}]*}\s*=\s*await\s+params/.test(s)) catatan.push('params TANPA await');
  if (pakaiSP && !/await\s+(props\.)?searchParams\b/.test(s)) catatan.push('searchParams TANPA await');
  if (pakaiCookies && !/await\s+cookies\(\)/.test(s)) catatan.push('cookies() TANPA await');
  if (pakaiHeaders && !/await\s+headers\(\)/.test(s)) catatan.push('headers() TANPA await');
  // pemakaian sinkron yang mencurigakan: params.x / searchParams.x tanpa await pada baris yang sama & bukan hasil await
  for (const [i, baris] of s.split('\n').entries()) {
    if (/(?<!await )(?<!\w)(params|searchParams)\.(\w+)/.test(baris) && !/await/.test(baris) && !/^\s*\/\//.test(baris)) catatan.push(`akses sinkron baris ${i + 1}: ${baris.trim().slice(0, 90)}`);
  }
  if (catatan.length) { masalah++; console.log(`${f}\n  - ${catatan.join('\n  - ')}`); }
}
console.log(`\nberkas diperiksa: ${diperiksa}; berkas bermasalah: ${masalah}`);
