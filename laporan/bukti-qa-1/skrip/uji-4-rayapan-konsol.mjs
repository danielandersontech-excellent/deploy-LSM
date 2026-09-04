#!/usr/bin/env node
// QA-1 butir 4a — RAYAPAN tautan internal + KONSOL BERSIH.
//  1. BFS dari beranda (tanpa login) dan dari /staf/dashboard untuk 5 peran: setiap <a href> internal diambil (fetch dengan
//     cookie peran) -> wajib 200 (atau 3xx ke halaman 200); 404/500 dicatat. Kedalaman maks 3, maks 150 URL per akar.
//  2. Setiap URL halaman unik dibuka di Chrome headless (CDP) -> Runtime.exceptionThrown & console.error/warn dikumpulkan;
//     halaman dengan error konsol dicatat (harus 0).
// Pemakaian: node uji-4-rayapan-konsol.mjs [URL publik] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as gabungJalur } from 'node:path';
// Profil Chrome sementara per run + dihapus saat keluar (QA-1: 162 profil HeadlessChrome* yatim memenuhi disk C: ±100 MB/run)
const PROFIL_CDP = mkdtempSync(gabungJalur(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL_CDP, { recursive: true, force: true }); } catch {} });
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PERAN = PROD ? { superadmin: [env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD] } : { superadmin: [env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD], redaktur: ['siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD], penulis: ['budi.santoso@warkopnusantara.id', env.SEED_STAF_PASSWORD], verifikator: ['siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD], pimpinan_wilayah: ['pimpinan.jabar@warkopnusantara.id', env.SEED_STAF_PASSWORD] };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const login = async (email, sandi) => { const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null; };
const hostU = new URL(U).host, hostUS = new URL(US).host;
const internal = (href, dasar) => { try { const u = new URL(href, dasar); if (![hostU, hostUS].includes(u.host)) return null; if (/^(mailto|tel|javascript):/.test(href)) return null; u.hash = ''; return u.href; } catch { return null; } };
const ABAIKAN = /\/api\/auth\/logout|\/_next\/|\.(png|jpg|jpeg|webp|svg|ico|pdf|mp4|xml|txt)$|\/unggahan\//;
const semuaHasil = []; let totalGagal = 0;
async function rayap(label, akar, tk) {
  const antre = [[akar, 0]]; const dilihat = new Set([akar]); const hasil = [];
  while (antre.length && dilihat.size <= 150) {
    const [url, dalam] = antre.shift();
    let r, html = ''; try { r = await fetch(url, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'follow' }); html = (r.headers.get('content-type') || '').includes('text/html') ? await r.text() : ''; } catch (g) { hasil.push({ url, status: 'GALAT ' + g.message }); continue; }
    hasil.push({ url, status: r.status, akhir: r.url !== url ? r.url : '' });
    if (r.status !== 200 && r.status !== 401) totalGagal++;
    if (dalam >= 3 || !html) continue;
    for (const m of html.matchAll(/<a[^>]+href="([^"#]+)"/g)) { const h = internal(m[1], url); if (h && !dilihat.has(h) && !ABAIKAN.test(h)) { dilihat.add(h); antre.push([h, dalam + 1]); } }
  }
  const buruk = hasil.filter((h) => h.status !== 200); console.log(`\n## Rayapan ${label} dari ${akar}: ${hasil.length} URL, bukan-200: ${buruk.length}`); for (const b of buruk) console.log(`  ${b.status}  ${b.url}${b.akhir ? ' → ' + b.akhir : ''}`);
  semuaHasil.push({ label, tk, halaman: hasil.filter((h) => h.status === 200 && !/\/api\//.test(h.url)).map((h) => h.url) });
}
console.log(`# QA-1 butir 4a — rayapan & konsol — ${U} / ${US} — ${new Date().toISOString()}`);
await rayap('publik (tanpa login)', `${U}/`, null);
const TK = {}; for (const [p, kred] of Object.entries(PERAN)) { TK[p] = await login(...kred); console.log(`login ${p}: ${TK[p] ? 'ok' : 'GAGAL'}`); if (TK[p]) await rayap(`staf ${p}`, `${US}/staf/dashboard`, TK[p]); }

// --- konsol peramban per halaman
console.log('\n## Konsol peramban per halaman (error/exception; warning dicatat terpisah)');
const port = 9800 + Math.floor(Math.random() * 30);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL_CDP}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let v = null; for (let i = 0; i < 40 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await tidur(250); } }
const wsB = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => { wsB.onopen = r; }); wsB.onclose = () => console.log('  (sambungan peramban tertutup)'); let idB = 0; const tB = new Map(); wsB.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tB.has(m.id)) { tB.get(m.id)(m); tB.delete(m.id); } };
const kirimB = (method, params = {}) => new Promise((r) => { const n = ++idB; tB.set(n, r); wsB.send(JSON.stringify({ id: n, method, params })); });
let halamanError = 0, halamanDiperiksa = 0; const peringatanSemua = [];
for (const grup of semuaHasil) {
  const { result: { browserContextId } } = await kirimB('Target.createBrowserContext'); const { result: { targetId } } = await kirimB('Target.createTarget', { url: 'about:blank', browserContextId });
  const ws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`); await new Promise((r) => { ws.onopen = r; }); let id = 0; const t = new Map(); let error = [], warn = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && t.has(m.id)) { t.get(m.id)(m); t.delete(m.id); return; } const p = m.params || {};
    if (m.method === 'Runtime.exceptionThrown') error.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split('\n')[0].slice(0, 160));
    if (m.method === 'Runtime.consoleAPICalled') { const s = p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160); if (p.type === 'error') error.push('console.error ' + s); else if (p.type === 'warning') warn.push(s); }
    if (m.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon/.test(p.entry.text)) error.push('log ' + p.entry.text.slice(0, 160)); };
  const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; t.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Log.enable'); await kirim('Network.enable');
  if (grup.tk) await kirim('Network.setCookie', { name: 'warkop_token', value: grup.tk, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
  const daftar = grup.halaman.filter((u, i, a) => a.indexOf(u) === i).slice(0, 60); console.log(`  [${grup.label}] membuka ${daftar.length} halaman…`);
  for (const url of daftar) { error = []; warn = []; await kirim('Page.navigate', { url }); await tidur(3000); halamanDiperiksa++; if (error.length) { halamanError++; console.log(`  ERROR ${url}\n    ${error.slice(0, 4).join('\n    ')}`); } if (warn.length) peringatanSemua.push(`${url}: ${warn[0]}`); }
  console.log(`  [${grup.label}] ${daftar.length} halaman dibuka`);
  ws.close(); // target dibiarkan; menutup target terakhir konteks pernah menghentikan proses tanpa ringkasan
}
wsB.close(); chrome.kill();
if (peringatanSemua.length) { console.log(`\n  peringatan (bukan error) — ${peringatanSemua.length} halaman, contoh:`); for (const w of peringatanSemua.slice(0, 6)) console.log('    ' + w.slice(0, 200)); }
console.log(`\nRINGKASAN 4a: URL bukan-200 (selain 401): ${totalGagal}; halaman dibuka: ${halamanDiperiksa}; halaman dengan error konsol: ${halamanError} -> ${totalGagal === 0 && halamanError === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
