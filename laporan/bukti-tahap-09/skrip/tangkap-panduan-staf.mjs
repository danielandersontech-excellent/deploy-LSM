#!/usr/bin/env node
// Tahap 9 F — tangkapan layar untuk PANDUAN-STAF.md (Chrome headless 1280×900, build produksi lokal, akun superadmin & verifikator).
// Keluaran: dokumen/panduan/*.png (ikut repo; dirujuk PANDUAN-STAF.md). Pemakaian: node tangkap-panduan-staf.mjs [URL]
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
const U = process.argv[2] || 'http://localhost:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms)); mkdirSync('dokumen/panduan', { recursive: true });
const login = async (email, sandi) => { const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const TKa = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD), TKv = await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD), TKr = await login('siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD);
const port = 9880 + Math.floor(Math.random() * 20);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let v = null; for (let i = 0; i < 40 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await tidur(250); } }
const wsB = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => { wsB.onopen = r; }); let idB = 0; const tB = new Map(); wsB.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tB.has(m.id)) { tB.get(m.id)(m); tB.delete(m.id); } };
const kirimB = (method, params = {}) => new Promise((r) => { const n = ++idB; tB.set(n, r); wsB.send(JSON.stringify({ id: n, method, params })); });
async function tab(token) {
  const { result: { browserContextId } } = await kirimB('Target.createBrowserContext'); const { result: { targetId } } = await kirimB('Target.createTarget', { url: 'about:blank', browserContextId });
  const ws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`); await new Promise((r) => { ws.onopen = r; }); let id = 0; const t = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && t.has(m.id)) { t.get(m.id)(m); t.delete(m.id); } };
  const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; t.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await kirim('Page.enable'); await kirim('Network.enable'); await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  if (token) await kirim('Network.setCookie', { name: 'warkop_token', value: token, url: U, httpOnly: true, sameSite: 'Lax' });
  return { async foto(jalur, nama, tinggi = 900, siap) { await kirim('Page.navigate', { url: `${U}${jalur}` }); await tidur(3500); if (siap) { await kirim('Runtime.evaluate', { expression: siap, awaitPromise: true }); await tidur(800); } await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: tinggi, deviceScaleFactor: 1, mobile: false }); await tidur(400); const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`dokumen/panduan/${nama}.png`, Buffer.from(f.result.data, 'base64')); console.log(`  ${nama}.png ← ${jalur}`); }, tutup() { ws.close(); } };
}
console.log(`# Tangkapan panduan staf — ${U}`);
const P = await tab(null);
await P.foto('/login', '01-login', 900);
await P.foto('/kontak', '02-formulir-pengaduan-publik', 1400);
await P.foto('/lacak', '03-lacak-pengaduan-publik', 900);
P.tutup();
const A = await tab(TKa);
await A.foto('/staf/dashboard', '10-dashboard-superadmin', 1100);
await A.foto('/staf/artikel', '20-kelola-artikel', 900);
await A.foto('/staf/artikel/baru', '21-editor-artikel', 1300);
await A.foto('/staf/pengaduan', '30-kelola-pengaduan', 900);
const daftar = await (await fetch(`${U}/api/staf/pengaduan?perHalaman=1`, { headers: { cookie: `warkop_token=${TKa}` } })).json(); const idP = daftar.baris?.[0]?.id;
if (idP) await A.foto(`/staf/pengaduan/${idP}`, '31-detail-pengaduan-ubah-status', 1400);
await A.foto('/staf/pengurus', '40-kelola-pengurus', 900);
await A.foto('/staf/program', '41-kelola-program', 900);
await A.foto('/staf/galeri', '42-kelola-galeri', 900);
await A.foto('/staf/pengguna', '50-kelola-pengguna', 900);
await A.foto('/staf/pengaturan', '51-pengaturan', 1100);
await A.foto('/staf/ganti-sandi', '52-ganti-sandi', 900);
A.tutup();
const V = await tab(TKv); await V.foto('/staf/dashboard', '11-dashboard-verifikator', 900); V.tutup();
const R = await tab(TKr); await R.foto('/staf/dashboard', '12-dashboard-redaktur', 900); R.tutup();
wsB.close(); chrome.kill(); console.log('selesai'); process.exit(0);
