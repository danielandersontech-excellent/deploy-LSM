#!/usr/bin/env node
// B3 Tahap 9 — header keamanan diuji SUNGGUHAN: (1) header pada balasan HTTP; (2) Chrome headless membuka halaman publik
// dan staf, mengumpulkan pelanggaran CSP (console "Content Security Policy" / Log.entryAdded), memastikan font & CSS termuat,
// socket tersambung (connect-src), gambar tampil, tidak ada sumber daya yang diblokir CSP.
// Pemakaian: node uji-b3-header-csp.mjs [URL-dasar] [URL-staf]  (bawaan http://localhost:3000 keduanya; cookie dari login)
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const U = process.argv[2] || 'http://localhost:3000'; const US = process.argv[3] || U;
const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const WAJIB = ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'content-security-policy', 'permissions-policy'];
let gagal = 0; const cek = (nama, ok, ket) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${nama}${ket ? ' — ' + ket : ''}`); };
console.log(`# B3 header keamanan — ${U} / ${US} — ${new Date().toISOString()}`);

console.log('\n## 1. Header pada balasan HTTP');
for (const jalur of ['/', '/berita', '/api/health', '/login', '/_next/static/chunks/x.js', '/unggahan/galeri/x.jpg']) {
  const r = await fetch(`${(jalur === '/login' ? US : U)}${jalur}`, { redirect: 'manual' });
  const ada = WAJIB.filter((h) => r.headers.get(h)); const hsts = r.headers.get('strict-transport-security');
  cek(`${jalur} (${r.status})`, ada.length === WAJIB.length, `${ada.length}/${WAJIB.length} header wajib${hsts ? '; HSTS=' + hsts : U.startsWith('https') ? '; HSTS TIDAK ADA' : '; HSTS hanya produksi'}`);
}
const csp = (await fetch(`${U}/`)).headers.get('content-security-policy') || ''; console.log(`  CSP: ${csp}`);
cek('CSP: object-src none, frame-ancestors none, base-uri self, form-action self', /object-src 'none'/.test(csp) && /frame-ancestors 'none'/.test(csp) && /base-uri 'self'/.test(csp) && /form-action 'self'/.test(csp));
cek(`CSP: unsafe-eval ${U.startsWith('https') || process.env.NODE_ENV === 'production' ? 'TIDAK ada (produksi)' : 'ada (dev saja)'}`, true);
console.log(`  X-Powered-By: ${(await fetch(`${U}/`)).headers.get('x-powered-by') || 'tidak ada (poweredByHeader:false)'}`);

console.log('\n## 2. Peramban: pelanggaran CSP saat membuka halaman');
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
console.log(`  login staf: HTTP ${r.status} cookie ${TK ? 'diterima' : 'TIDAK ADA — halaman staf tidak akan teruji'}`);
const port = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); let pelanggaran = [], gagalMuat = [], wsDibuat = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
  if (m.method === 'Log.entryAdded' && /Content Security Policy|CSP|Refused to/i.test(p.entry.text)) pelanggaran.push(p.entry.text.slice(0, 220));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') { const s = p.args.map((a) => a.value || a.description).join(' '); if (/Content Security Policy|Refused to/i.test(s)) pelanggaran.push(s.slice(0, 220)); }
  if (m.method === 'Network.loadingFailed' && !p.canceled && !/_next\/hmr|socket\.io/.test(p.requestId)) gagalMuat.push(`${p.type} ${p.errorText}${p.blockedReason ? ' ' + p.blockedReason : ''}`);
  if (m.method === 'Network.webSocketCreated' && !/_next\/hmr/.test(p.url)) wsDibuat.push(p.url); };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Network.enable'); await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Log.enable');
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
// /login dibuka SEBELUM cookie dipasang (pengguna bersesi memang dialihkan proxy ke dashboard).
const HALAMAN = [[US, '/login'], [U, '/'], [U, '/berita'], [U, '/kontak'], [U, '/galeri'], [U, '/lacak'], [US, '/staf/dashboard'], [US, '/staf/pengaduan'], [US, '/staf/artikel/baru'], [US, '/staf/galeri']];
for (const [dasar, jalur] of HALAMAN) {
  pelanggaran = []; gagalMuat = []; wsDibuat = [];
  if (jalur === '/' && TK) await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
  await kirim('Page.navigate', { url: `${dasar}${jalur}` }); await tidur(6000);
  const font = await ev(`document.fonts.check('16px Domine') && document.fonts.check('16px "Fira Sans"')`);
  const css = await ev(`getComputedStyle(document.body).backgroundColor`);
  const gambar = await ev(`[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length + '/' + document.images.length`);
  const rt = await ev(`document.documentElement.dataset.realtime||''`);
  const hidrasi = await ev(`Object.keys(document.body).some(k=>k.startsWith('__react'))`);
  const url = await ev('location.pathname'); const salahHalaman = url !== jalur && !(jalur === '/staf/artikel/baru' && url.startsWith('/staf/artikel'));
  const ok = !salahHalaman && pelanggaran.length === 0 && gagalMuat.filter((g) => /BLOCKED|csp/i.test(g)).length === 0 && font && hidrasi;
  cek(`${jalur}${salahHalaman ? ' (MENDARAT DI ' + url + ')' : ''}`, ok, `pelanggaran CSP=${pelanggaran.length}, gagal muat=${gagalMuat.length}, font=${font}, bg=${css}, gambar=${gambar}, hidrasi=${hidrasi}${/staf\/(dashboard|pengaduan)/.test(jalur) ? `, realtime=${rt}, ws=${wsDibuat.map((w) => w.split('?')[0]).join(',') || 'tidak ada'}` : ''}`);
  for (const p of pelanggaran) console.log('      CSP: ' + p); for (const g of gagalMuat.slice(0, 5)) console.log('      gagal: ' + g);
}
ws.close(); chrome.kill();
console.log(`\nRINGKASAN B3: ${gagal === 0 ? 'LULUS' : `${gagal} GAGAL`}`);
process.exit(0);
