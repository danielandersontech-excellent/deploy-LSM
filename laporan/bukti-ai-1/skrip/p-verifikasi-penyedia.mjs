#!/usr/bin/env node
// RUN AI-1 P — verifikasi prasyarat: tiap kunci/penyedia dipanggil dengan permintaan TERKECIL.
// Nilai kunci TIDAK PERNAH dicetak; hanya status HTTP + ringkasan balasan.
//   Anthropic : GET /v1/models (bukan Messages; gratis, tidak menghabiskan kredit) -> kunci sah + daftar model
//   Pixabay   : GET /api/?q=flood&per_page=3 (bila ada PIXABAY_API_KEY)
//   Pexels    : GET /v1/search?query=flood&per_page=1 (bila ada PEXELS_API_KEY)
//   Openverse : GET /v1/images/?q=flood&license=cc0,pdm&page_size=3 (tanpa kunci)
//   Wikimedia : GET commons api.php generator=search ... extmetadata (tanpa kunci)
// Pemakaian: node laporan/bukti-ai-1/skrip/p-verifikasi-penyedia.mjs
import 'dotenv/config';

const UA = 'WarkopNusantaraBot/1.0 (https://warkopnusantara.id; redaksi@warkopnusantara.id) node-fetch';
const ada = (k) => (process.env[k] ? `ada (${process.env[k].length} karakter)` : 'TIDAK ADA');
console.log(`# RUN AI-1 P — verifikasi penyedia — ${new Date().toISOString()}`);
console.log(`ANTHROPIC_API_KEY: ${ada('ANTHROPIC_API_KEY')} | PIXABAY_API_KEY: ${ada('PIXABAY_API_KEY')} | PEXELS_API_KEY: ${ada('PEXELS_API_KEY')}`);

async function coba(nama, fn) {
  try { console.log(`\n## ${nama}\n${await fn()}`); } catch (g) { console.log(`\n## ${nama}\nGAGAL: ${String(g?.message || g).replace(process.env.ANTHROPIC_API_KEY || '\u0000', '<kunci>').replace(process.env.PIXABAY_API_KEY || '\u0000', '<kunci>').slice(0, 300)}`); }
}

await coba('Anthropic GET /v1/models', async () => {
  if (!process.env.ANTHROPIC_API_KEY) return 'dilewati: tidak ada kunci';
  const r = await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`;
  const id = (j.data || []).map((m) => m.id);
  return `HTTP ${r.status}; ${id.length} model; sonnet: ${id.filter((x) => /sonnet/.test(x)).join(', ')}\n  claude-sonnet-5-5 ${id.includes('claude-sonnet-5-5') ? 'ADA' : 'TIDAK ADA'}; claude-sonnet-5 ${id.includes('claude-sonnet-5') ? 'ADA' : 'TIDAK ADA'}`;
});

await coba('Pixabay', async () => {
  if (!process.env.PIXABAY_API_KEY) return 'dilewati: tidak ada kunci';
  const u = `https://pixabay.com/api/?key=${encodeURIComponent(process.env.PIXABAY_API_KEY)}&q=flood&image_type=photo&orientation=horizontal&min_width=1200&per_page=3&safesearch=true`;
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`;
  const h = j.hits?.[0] || {};
  return `HTTP ${r.status}; totalHits=${j.totalHits}; hit pertama: imageWidth=${h.imageWidth} imageHeight=${h.imageHeight} largeImageURL=${h.largeImageURL ? 'ada' : 'tidak'} user=${h.user ? 'ada' : 'tidak'} tags="${h.tags}" pageURL=${h.pageURL ? 'ada' : 'tidak'}; x-ratelimit-remaining=${r.headers.get('x-ratelimit-remaining')}`;
});

await coba('Pexels', async () => {
  if (!process.env.PEXELS_API_KEY) return 'dilewati: tidak ada kunci (penyedia nonaktif)';
  const r = await fetch('https://api.pexels.com/v1/search?query=flood&per_page=1&orientation=landscape', { headers: { Authorization: process.env.PEXELS_API_KEY, 'user-agent': UA } });
  const j = await r.json().catch(() => ({}));
  return `HTTP ${r.status}; total_results=${j.total_results}`;
});

await coba('Openverse (tanpa kunci)', async () => {
  const r = await fetch('https://api.openverse.org/v1/images/?q=flood&license=cc0,pdm&page_size=3&mature=false', { headers: { 'user-agent': UA, accept: 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`;
  const h = j.results?.[0] || {};
  const rl = ['x-ratelimit-limit-anon-burst', 'x-ratelimit-available-anon-burst', 'x-ratelimit-limit-anon-sustained', 'x-ratelimit-available-anon-sustained'].map((k) => `${k}=${r.headers.get(k)}`).join(' ');
  return `HTTP ${r.status}; result_count=${j.result_count}; pertama: license=${h.license} width=${h.width} height=${h.height} url=${h.url ? 'ada' : 'tidak'} creator=${h.creator ? 'ada' : 'tidak'} source=${h.source} tags=${(h.tags || []).length}\n  ${rl}`;
});

await coba('Wikimedia Commons (tanpa kunci)', async () => {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent('flood filetype:bitmap') + '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata%7Cmime&iiurlwidth=1920&iiextmetadatafilter=LicenseShortName%7CLicense%7CArtist%7CImageDescription&format=json&formatversion=2';
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`;
  const p = j.query?.pages || [];
  return `HTTP ${r.status}; ${p.length} berkas; lisensi: ${p.map((x) => { const e = x.imageinfo?.[0]?.extmetadata || {}; return `${(e.LicenseShortName?.value || '?')}/${(e.License?.value || '?')} ${x.imageinfo?.[0]?.width}x${x.imageinfo?.[0]?.height} thumb=${x.imageinfo?.[0]?.thumbwidth}`; }).join(' | ')}`;
});
