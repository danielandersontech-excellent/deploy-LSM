#!/usr/bin/env node
// QA-2 B0b — alur GANTI SANDI utuh lewat antarmuka (Chrome headless, ketik sungguhan):
//   superadmin reset sandi akun uji (API) → buka /login → ketik email + sandi sementara → Enter → dialihkan ke
//   /staf/ganti-sandi (wajib) → ketik sandi lama/baru/ulang (≥ 20 karakter per kolom; fokus harus bertahan) → kirim →
//   mulus ke /staf/dashboard (sesi baru) → klik Keluar → /login → login sandi baru 200 → sandi lama 401.
// Juga diulang pada emulasi ponsel 375 px. Pemakaian: node uji-b0b-ganti-sandi-ui.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-')); process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
mkdirSync('laporan/bukti-qa-2/tangkapan', { recursive: true });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const api = (m, p, tk, b) => fetch(`${US}${p}`, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: b ? JSON.stringify(b) : undefined, redirect: 'manual' });
const loginApi = async (email, sandi) => { const r = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); return { s: r.status, tk: ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null }; };
console.log(`# QA-2 B0b — alur ganti sandi lewat UI — ${US} — ${new Date().toISOString()}`);
const admin = await loginApi(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD); cek('login superadmin (API)', admin.s === 200, `HTTP ${admin.s}`);
const port = 9600 + Math.floor(Math.random() * 40);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); const konsol = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } if (m.method === 'Runtime.exceptionThrown') konsol.push((m.params.exceptionDetails.exception?.description || '').split('\n')[0].slice(0, 120)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') konsol.push(m.params.args.map((a) => a.value || a.description).join(' ').slice(0, 120)); };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const foto = async (n) => { const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`laporan/bukti-qa-2/tangkapan/${n}.png`, Buffer.from(f.result.data, 'base64')); };
const tungguJalur = async (re, ms = 12000) => { const awal = Date.now(); while (Date.now() - awal < ms) { const p = await ev('location.pathname'); if (re.test(p)) return p; await tidur(300); } return await ev('location.pathname'); };
async function ketik(selektor, teks) {
  await ev(`(() => { const el = document.querySelector(${JSON.stringify(selektor)}); el.scrollIntoView({ block: 'center' }); el.focus(); })()`); await tidur(80);
  let hilang = -1;
  for (let c = 0; c < teks.length; c++) { const ch = teks[c]; await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await tidur(20); if (c % 4 === 3 && !(await ev(`document.activeElement === document.querySelector(${JSON.stringify(selektor)})`))) { hilang = c + 1; break; } }
  const nilai = await ev(`document.querySelector(${JSON.stringify(selektor)})?.value ?? null`);
  return { utuh: nilai === teks && hilang < 0, hilang, panjang: nilai == null ? null : nilai.length };
}
const tekanEnter = async () => { await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' }); await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); };
const klikTeks = async (re) => { const p = await ev(`(() => { const b = [...document.querySelectorAll('button, a')].find(b => ${re}.test(b.textContent + ' ' + (b.getAttribute('aria-label') || '')) && b.getBoundingClientRect().width > 0); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 }); await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 }); return true; };
const emailUji = `uji.b0b.${Date.now()}@warkopnusantara.id`; const sandiAwal = 'SandiAwal-B0b-2026!', sementara = 'Sementara-B0b-2026-xyz!', sandiBaru = 'SandiBaruPanjang-B0b-2026!!';
const rb = await api('POST', '/api/staf/pengguna', admin.tk, { nama: 'Pengguna Uji B0b', email: emailUji, peran: 'penulis', kata_sandi: sandiAwal, aktif: true }); const idUji = (await rb.json()).pengguna?.id; cek('buat pengguna uji', rb.status === 201, `id ${idUji}`);
for (const [label, lebar, tinggi, mobile] of [['desktop 1280', 1280, 900, false], ['ponsel 375', 375, 812, true]]) {
  console.log(`\n## Alur lewat UI — ${label}`);
  await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: tinggi, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await kirim('Network.clearBrowserCookies');
  const rr = await api('POST', `/api/staf/pengguna/${idUji}/reset-sandi`, admin.tk, { kata_sandi_baru: sementara }); cek('superadmin reset sandi akun uji (API)', rr.status === 200, `HTTP ${rr.status}`);
  await kirim('Page.navigate', { url: `${US}/login` }); await tidur(3500);
  const k1 = await ketik('#staff-id', emailUji); const k2 = await ketik('#password', sementara);
  cek('ketik email & sandi sementara di /login: nilai utuh, fokus bertahan', k1.utuh && k2.utuh, `email ${k1.panjang}/${emailUji.length}${k1.hilang > 0 ? ' fokus hilang @' + k1.hilang : ''}; sandi ${k2.panjang}/${sementara.length}${k2.hilang > 0 ? ' fokus hilang @' + k2.hilang : ''}`);
  await tekanEnter(); const p1 = await tungguJalur(/\/staf\/ganti-sandi/); await tidur(1500); await foto(`b0b-${mobile ? '375' : '1280'}-1-dipaksa-ganti`);
  cek('setelah masuk → dialihkan ke /staf/ganti-sandi (wajib)', p1 === '/staf/ganti-sandi', p1);
  const k3 = await ketik('#sandi-lama', sementara); const k4 = await ketik('#sandi-baru', sandiBaru); const k5 = await ketik('#sandi-ulang', sandiBaru);
  cek('ketik 3 kolom sandi (≥ 20 karakter): nilai utuh, fokus bertahan', k3.utuh && k4.utuh && k5.utuh, `lama ${k3.panjang}${k3.hilang > 0 ? ' fokus hilang @' + k3.hilang : ''}, baru ${k4.panjang}${k4.hilang > 0 ? ' fokus hilang @' + k4.hilang : ''}, ulang ${k5.panjang}${k5.hilang > 0 ? ' fokus hilang @' + k5.hilang : ''}`);
  await tekanEnter(); const p2 = await tungguJalur(/\/staf\/dashboard/); await tidur(2000); await foto(`b0b-${mobile ? '375' : '1280'}-2-sesudah-ganti`);
  const judul = await ev('document.title'); const teksGalat = await ev(`document.body.innerText.match(/(tidak sesuai|gagal|kesalahan|minimal)[^\\n]*/i)?.[0] || ''`);
  cek('ganti sandi sukses → mulus ke /staf/dashboard (sesi baru)', p2 === '/staf/dashboard' && /Dashboard/.test(judul), `${p2} "${judul}" ${teksGalat}`);
  const saya = await ev(`fetch('/api/auth/saya').then(r => r.json()).then(j => JSON.stringify({ wajib: j.pengguna?.wajib_ganti_sandi ?? j.wajibGantiSandi, peran: j.pengguna?.peran })).catch(e => 'galat ' + e.message)`); cek('sesi baru: /api/auth/saya wajib_ganti_sandi=0', /"wajib":0/.test(saya || ''), saya);
  if (mobile) { await klikTeks('/buka menu/i'); await tidur(800); } // 375: tombol Keluar ada di laci sidebar
  const klik = await klikTeks('/keluar/i'); const p3 = await tungguJalur(/\/login/); cek('klik Keluar → /login', klik && p3 === '/login', p3);
  await tidur(1000); const k6 = await ketik('#staff-id', emailUji); const k7 = await ketik('#password', sandiBaru); await tekanEnter(); const p4 = await tungguJalur(/\/staf\/dashboard/);
  cek('login sandi BARU lewat UI → /staf/dashboard', k6.utuh && k7.utuh && p4 === '/staf/dashboard', p4);
  const lama = await loginApi(emailUji, sementara); const baru = await loginApi(emailUji, sandiBaru); cek('API: sandi lama 401, sandi baru 200', lama.s === 401 && baru.s === 200, `lama ${lama.s}, baru ${baru.s}`);
}
ws.close(); chrome.kill();
console.log(`\nkonsol error: ${konsol.length}${konsol.length ? '\n  ' + konsol.slice(0, 6).join('\n  ') : ''}`);
if (!PROD) { const { kueri, tutupPool } = await import('../../../lib/db/index.js'); await kueri("DELETE FROM users WHERE email LIKE 'uji.b0b.%@warkopnusantara.id'"); await tutupPool(); console.log('  pengguna uji dihapus (SQL)'); }
else { const d = await api('PATCH', `/api/staf/pengguna/${idUji}`, admin.tk, { nama: 'Pengguna Uji B0b', email: emailUji, peran: 'penulis', aktif: false }); console.log(`  pengguna uji ${emailUji} dinonaktifkan (${d.status}); PRODUKSI: hapus lewat SQL (SELECT dulu)`); }
console.log(`\nRINGKASAN B0b: ${gagal === 0 ? 'LULUS' : `${gagal} GAGAL`}`);
process.exit(0);
