#!/usr/bin/env node
// RUN AI-1 E — UI 375/768/1280 konsol bersih + tangkapan: /staf/artikel/asisten (riwayat kartu), /staf/artikel (tombol
// Asisten AI), editor artikel asal-AI (pita), pratinjau artikel AI. Turunan uji-g-konsol QA-4 (profil Chrome sementara
// dihapus saat keluar). Juga: sidebar "Asisten AI" aktif HANYA di /staf/artikel/asisten (bukan "Kelola Artikel" sekaligus),
// tidak ada em/en dash tampil, tidak ada gulir mendatar, tidak ada kontrol tumpang tindih.
// Pemakaian: node laporan/bukti-ai-1/skrip/uji-ui-konsol.mjs [URL] [--produksi] (sesi: SEED lokal / env TOKEN_STAF)
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PROD = process.argv.includes('--produksi');
const U = argv[0] || (PROD ? 'https://staf.warkopnusantara.id' : 'http://localhost:3000');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch { /* abaikan */ } });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const TANGKAPAN = 'laporan/bukti-ai-1/tangkapan'; mkdirSync(TANGKAPAN, { recursive: true });
const AWALAN = PROD ? 'produksi' : 'lokal';

let tk = process.env.TOKEN_STAF || null;
if (!tk) {
  const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'budi.santoso@warkopnusantara.id', kataSandi: env.SEED_STAF_PASSWORD }) });
  if (r.status === 200) tk = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
}
if (!tk) { console.log('GAGAL: tidak ada sesi staf'); process.exit(1); }
// artikel asal-AI terbaru (dari uji e2e nyata) untuk halaman editor & pratinjau
const daftar = await (await fetch(`${U}/api/staf/artikel?status=draf&perHalaman=50`, { headers: { cookie: `warkop_token=${tk}` } })).json();
let idAi = process.env.ID_ARTIKEL_AI ? Number(process.env.ID_ARTIKEL_AI) : null;
if (!idAi) {
  for (const a of daftar.baris || []) { const h = await (await fetch(`${U}/staf/artikel/${a.id}`, { headers: { cookie: `warkop_token=${tk}` } })).text(); if (/Draf AI: verifikasi redaksi sebelum terbit/.test(h)) { idAi = a.id; break; } }
}
console.log(`# RUN AI-1 E — UI konsol & tangkapan — ${U} — ${new Date().toISOString()}\n# artikel asal-AI untuk editor/pratinjau: ${idAi ?? 'TIDAK DITEMUKAN'}`);
const HALAMAN = ['/staf/artikel/asisten', '/staf/artikel', ...(idAi ? [`/staf/artikel/${idAi}`, `/staf/artikel/${idAi}/pratinjau`] : [])];

const port = 9600 + Math.floor(Math.random() * 90);
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
await kirim('Network.setCookie', { name: 'warkop_token', value: tk, url: U, httpOnly: true, secure: U.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const evAsync = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;

const PERIKSA = `(() => {
  const iw = document.documentElement.clientWidth;
  const kontrol = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const dalamDetailsTertutup = !el.matches('summary') && [...document.querySelectorAll('details:not([open])')].some(d => d.contains(el) && !d.querySelector(':scope > summary')?.contains(el)); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]') && !dalamDetailsTertutup; });
  const tumpang = [];
  for (let i = 0; i < kontrol.length; i++) for (let k = i + 1; k < kontrol.length; k++) {
    if (kontrol[i].contains(kontrol[k]) || kontrol[k].contains(kontrol[i])) continue;
    const a = kontrol[i].getBoundingClientRect(), b = kontrol[k].getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)); const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    if (ix * iy > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || 'x').trim().slice(0, 16) + ' x ' + (kontrol[k].textContent || 'x').trim().slice(0, 16));
  }
  const aktif = [...document.querySelectorAll('nav[aria-label="Navigasi staf"] a[aria-current="page"]')].map(a => a.textContent.trim());
  return { jalur: location.pathname, gulirMendatar: document.documentElement.scrollWidth > iw + 1, tumpang: tumpang.slice(0, 3),
    teksGalat: /Application error|Internal Server Error|Terjadi kesalahan tak terduga/.test(document.body.innerText), dash: /[\\u2014\\u2013]/.test(document.body.innerText),
    aktif, pita: /Draf AI: verifikasi redaksi sebelum terbit/i.test(document.body.innerText), kartu: document.querySelectorAll('article[aria-labelledby^="saran-"]').length,
    tombolAsisten: !!document.querySelector('a[href="/staf/artikel/asisten"]'), form: !!document.querySelector('input#topik') };
})()`;

let sel = 0, gagal = 0;
for (const [w, h, mobile] of [[375, 812, true], [768, 1024, true], [1280, 900, false]]) {
  await kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  for (const p of HALAMAN) {
    konsol = []; jaringan = [];
    await kirim('Page.navigate', { url: U + p }); await tidur(3000);
    const r = await ev(PERIKSA); sel++;
    const masalah = [];
    if (!r) masalah.push('tidak terbaca'); else {
      if (r.teksGalat) masalah.push('TEKS GALAT'); if (r.gulirMendatar) masalah.push('gulir mendatar'); if (r.tumpang.length) masalah.push('tumpang: ' + r.tumpang.join(' | ')); if (r.dash) masalah.push('em/en dash tampil');
      if (p === '/staf/artikel/asisten') { if (!r.form) masalah.push('form topik tidak ada'); if (w >= 768 && JSON.stringify(r.aktif) !== JSON.stringify(['Asisten AI'])) masalah.push('sidebar aktif: ' + JSON.stringify(r.aktif)); if (r.kartu < 1) masalah.push('tidak ada kartu riwayat'); }
      if (p === '/staf/artikel') { if (!r.tombolAsisten) masalah.push('tombol Asisten AI tidak ada'); if (w >= 768 && JSON.stringify(r.aktif) !== JSON.stringify(['Kelola Artikel'])) masalah.push('sidebar aktif: ' + JSON.stringify(r.aktif)); }
      if (/^\/staf\/artikel\/\d+$/.test(p) && !r.pita) masalah.push('pita Draf AI tidak tampil');
      if (/pratinjau$/.test(p) && r.pita) masalah.push('pita Draf AI BOCOR ke pratinjau');
    }
    if (konsol.length) masalah.push('konsol: ' + konsol.slice(0, 2).join(' | ')); if (jaringan.length) masalah.push('jaringan: ' + jaringan.slice(0, 2).join(' | '));
    const nama = `${AWALAN}-${w}-${p.replace(/^\/staf\//, '').replace(/[^a-z0-9]+/gi, '-')}.png`;
    const foto = await kirim('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (foto.result?.data) writeFileSync(join(TANGKAPAN, nama), Buffer.from(foto.result.data, 'base64'));
    if (masalah.length) { gagal++; console.log(`  GAGAL ${w} ${p}: ${masalah.join('; ')}`); } else console.log(`  OK    ${w} ${p} (kartu ${r.kartu}, aktif ${JSON.stringify(r.aktif)}) -> ${nama}`);
  }
}
// interaksi: ketik topik 2 karakter -> tombol Cari nonaktif; 3 karakter -> aktif (tanpa mengirim)
await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await kirim('Page.navigate', { url: `${U}/staf/artikel/asisten` }); await tidur(3000);
const keadaan = await evAsync(`(async () => { const i = document.querySelector('input#topik'); const b = document.querySelector('button[type="submit"]'); const set = (v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); }; set('ab'); await new Promise(r => setTimeout(r, 200)); const a = b.disabled; set('banjir'); await new Promise(r => setTimeout(r, 200)); return { duaKarakter: a, tigaLebih: b.disabled }; })()`);
sel++;
if (!keadaan || keadaan.duaKarakter !== true || keadaan.tigaLebih !== false) { gagal++; console.log(`  GAGAL interaksi tombol Cari: ${JSON.stringify(keadaan)}`); } else console.log(`  OK    tombol Cari nonaktif pada 2 karakter, aktif pada "banjir" (tidak dikirim)`);
ws.close(); chrome.kill();
console.log(`\nRINGKASAN UI konsol (${AWALAN}): ${sel} sel, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
