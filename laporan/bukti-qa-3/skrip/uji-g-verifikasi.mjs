#!/usr/bin/env node
// QA-3 G — sapu konsol halaman yang tersentuh + verifikasi menyeluruh.
// Halaman yang tersentuh RUN QA-3: seluruh halaman publik (navbar & footer berubah di semuanya),
// /struktur (bagan baru), /program (kategori dinamis), dan ruang staf /staf/pengurus, /staf/program,
// /staf/pengaturan. Tiap halaman dibuka di Chrome pada 375 dan 1280: galat konsol, permintaan >= 400,
// gulir mendatar, dan kontrol tumpang tindih harus nol.
// Dipakai untuk LOKAL dan PRODUKSI (URL diberikan sebagai argumen).
// Profil Chrome sementara dibuat dan DIHAPUS saat keluar.
// Pemakaian: node laporan/bukti-qa-3/skrip/uji-g-verifikasi.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U;
const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch { /* abaikan */ } });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

const PUBLIK = ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas'];
const STAF = ['/staf/pengurus', '/staf/program', '/staf/pengaturan'];

let tk = null;
try {
  const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
  if (r.status === 200) tk = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
} catch { /* biarkan; halaman staf akan dilewati */ }

const port = 9800 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
if (!t) { console.log('GAGAL: Chrome tidak dapat dijalankan'); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); let konsol = [], jaringan = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split(String.fromCharCode(10))[0].slice(0, 120));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 120));
  if (m.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon/.test(p.entry.text)) konsol.push('log ' + p.entry.text.slice(0, 120));
  if (m.method === 'Network.responseReceived' && p.response.status >= 400 && !/socket\.io/.test(p.response.url)) jaringan.push(`${p.response.status} ${p.type} ${p.response.url.slice(-60)}`);
};
const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Log.enable'); await kirim('Network.enable');
if (tk) await kirim('Network.setCookie', { name: 'warkop_token', value: tk, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;

const PERIKSA = `(() => {
  const iw = document.documentElement.clientWidth;
  const kontrol = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'); });
  const tumpang = [];
  for (let i = 0; i < kontrol.length; i++) for (let k = i + 1; k < kontrol.length; k++) {
    if (kontrol[i].contains(kontrol[k]) || kontrol[k].contains(kontrol[i])) continue;
    const a = kontrol[i].getBoundingClientRect(), b = kontrol[k].getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    if (ix * iy > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || 'x').trim().slice(0, 16) + ' x ' + (kontrol[k].textContent || 'x').trim().slice(0, 16));
  }
  return {
    jalur: location.pathname,
    gulirMendatar: document.documentElement.scrollWidth > iw + 1,
    tumpang: tumpang.slice(0, 3),
    teksGalat: /Application error|Internal Server Error|Terjadi kesalahan tak terduga/.test(document.body.innerText),
    adaMasukStaff: /Masuk Staff/.test(document.body.innerText),
    footerPenuh: (() => { const f = document.querySelector('footer'); if (!f) return null; const r = f.getBoundingClientRect(); return Math.round(r.left) === 0 && Math.round(r.width) === iw; })(),
  };
})()`;

console.log(`# QA-3 G — sapu konsol & tata letak halaman tersentuh — ${U} — ${new Date().toISOString()}`);
console.log(`# sesi staf: ${tk ? 'ada' : 'TIDAK ADA (halaman staf dilewati)'}`);
let sel = 0, gagal = 0;
for (const [w, h, mobile] of [[375, 812, true], [1280, 900, false]]) {
  await kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  const daftar = [...PUBLIK.map((p) => ({ p, url: U + p, staf: false })), ...(tk ? STAF.map((p) => ({ p, url: US + p, staf: true })) : [])];
  for (const { p, url, staf } of daftar) {
    konsol = []; jaringan = [];
    await kirim('Page.navigate', { url }); await tidur(2800);
    const r = await ev(PERIKSA); sel++;
    const masukStaffBuruk = !staf && r?.adaMasukStaff;
    const footerBuruk = !staf && r?.footerPenuh === false;
    const ok = r && !r.teksGalat && konsol.length === 0 && jaringan.length === 0 && !r.gulirMendatar && r.tumpang.length === 0 && !masukStaffBuruk && !footerBuruk;
    if (!ok) {
      gagal++;
      console.log(`  GAGAL ${w} ${p}: ${!r ? 'tidak terbaca; ' : ''}${r?.teksGalat ? 'TEKS GALAT; ' : ''}${konsol.length ? 'konsol: ' + konsol.slice(0, 2).join(' | ') + '; ' : ''}${jaringan.length ? 'jaringan: ' + jaringan.slice(0, 2).join(' | ') + '; ' : ''}${r?.gulirMendatar ? 'gulir mendatar; ' : ''}${r?.tumpang?.length ? 'tumpang: ' + r.tumpang.join(' | ') + '; ' : ''}${masukStaffBuruk ? 'masih ada "Masuk Staff"; ' : ''}${footerBuruk ? 'footer tidak penuh' : ''}`);
    }
  }
  console.log(`  ${w}px: ${daftar.length} halaman diperiksa`);
}
ws.close(); chrome.kill();
console.log(`\nRINGKASAN G (${PROD ? 'produksi' : 'lokal'}): ${sel} sel, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
