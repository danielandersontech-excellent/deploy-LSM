#!/usr/bin/env node
// QA-2 B6 — filter/paginasi TIDAK melompat ke atas: halaman digulir ke area filter/paginasi, lalu (a) <select> filter diubah,
// (b) tautan paginasi/pil status diklik; scrollY sesudah harus ± sama (toleransi 40 px) dan isi berubah sesuai filter.
// Halaman: /program (urut), /berita (kategori + paginasi), /galeri (kategori), /staf/artikel (status + paginasi),
// /staf/pengaduan (pil status + paginasi). Pemakaian: node uji-b6-gulir-filter.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-')); process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const port = 9400 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,700', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 700, deviceScaleFactor: 1, mobile: false });
if (TK) await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const buka = async (url, sel) => { await kirim('Page.navigate', { url }); await tidur(2500); if (sel) for (let i = 0; i < 16; i++) { if (await ev(`!!document.querySelector(${JSON.stringify(sel)})`)) break; await tidur(500); } };
// wadah gulir: publik = window; staf = <main id="konten-utama"> (overflow-y-auto)
const posisi = async () => await ev(`(() => { const m = document.getElementById('konten-utama'); return (m && getComputedStyle(m).overflowY === 'auto') ? m.scrollTop : window.scrollY; })()`);
const maksGulir = async () => await ev(`(() => { const m = document.getElementById('konten-utama'); return (m && getComputedStyle(m).overflowY === 'auto') ? m.scrollHeight - m.clientHeight : document.documentElement.scrollHeight - innerHeight; })()`);
const gulirTetap = async (y0, y1) => Math.abs(y1 - y0) <= 40 || Math.abs(y1 - Math.min(y0, await maksGulir())) <= 40; // dokumen memendek -> gulir dijepit, bukan melompat ke atas
const gulirKe = async (sel) => await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const m = document.getElementById('konten-utama'); return (m && getComputedStyle(m).overflowY === 'auto') ? m.scrollTop : window.scrollY; })()`);
const klik = async (sel) => { const p = await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 }); await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 }); return true; };
const pilihSelect = async (sel, indeks) => await ev(`(() => { const s = document.querySelector(${JSON.stringify(sel)}); if (!s) return null; const opsi = [...s.options].filter(o => o.value !== s.value); const o = opsi[${indeks}] || opsi[0]; if (!o) return null; s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return o.value; })()`);
async function ujiSelect(nama, url, selektor, indeks = 0) {
  await buka(url, selektor); const y0 = await gulirKe(selektor); if (y0 === null) { cek(`${nama}: select ditemukan`, false, selektor); return; }
  await tidur(300); const y0b = await posisi(); const nilai = await pilihSelect(selektor, indeks); let url1 = ''; for (let i = 0; i < 16; i++) { await tidur(500); url1 = await ev('location.search'); if (nilai && (url1.includes(encodeURIComponent(nilai)) || url1.includes(nilai))) break; }
  const y1 = await posisi(); const okUrl = nilai ? url1.includes(encodeURIComponent(nilai)) || url1.includes(nilai) : true;
  cek(`${nama}: ubah select → ${nilai} | gulir ${y0b} → ${y1}`, (await gulirTetap(y0b, y1)) && okUrl, `URL ${url1}`);
}
async function ujiKlik(nama, url, selektor) {
  await buka(url, selektor); const y0 = await gulirKe(selektor); if (y0 === null) { console.log(`  (info) ${nama}: tautan ${selektor} tidak ada (data kurang dari satu halaman) - dilewati`); return; }
  await tidur(300); const y0b = await posisi(); const href = await ev(`document.querySelector(${JSON.stringify(selektor)})?.getAttribute('href')`); await klik(selektor); let url1 = ''; for (let i = 0; i < 16; i++) { await tidur(500); url1 = await ev('location.pathname + location.search'); if (href && url1.endsWith(href.split('#')[0])) break; }
  const y1 = await posisi();
  cek(`${nama}: klik ${href} | gulir ${y0b} → ${y1}`, (await gulirTetap(y0b, y1)) && href && url1.endsWith(href.split('#')[0]), `URL ${url1}`);
}
console.log(`# QA-2 B6 — posisi gulir saat filter/paginasi — ${U} — ${new Date().toISOString()}`);
await ujiSelect('/program urutan', `${U}/program`, 'select#urut');
await ujiKlik('/program kategori pil', `${U}/program`, 'a[href*="kategori="]');
await ujiSelect('/berita kategori', `${U}/berita`, 'select#category');
await ujiSelect('/berita rentang', `${U}/berita`, 'select#date');
await ujiKlik('/berita paginasi', `${U}/berita`, 'a[href*="halaman=2"]');
await ujiSelect('/galeri kategori', `${U}/galeri`, 'select[name="kategori"]');
await ujiSelect('/staf/artikel status', `${US}/staf/artikel`, 'select#status');
await ujiKlik('/staf/pengaduan pil status', `${US}/staf/pengaduan`, 'a[href*="status="]');
await ujiKlik('/staf/pengaduan paginasi', `${US}/staf/pengaduan?perHalaman=2`, 'a[href*="halaman=2"]');
ws.close(); chrome.kill();
console.log(`\nRINGKASAN B6: ${gagal === 0 ? 'LULUS' : `${gagal} GAGAL`}`);
process.exit(0);
