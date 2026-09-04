#!/usr/bin/env node
// QA-2 B0c — audit KETIK terprogram di SEMUA formulir client: tiap kolom teks/sandi/textarea/search diketik ≥ 20 karakter
// (termasuk karakter khusus aman) lewat CDP Input.dispatchKeyEvent + insertText per karakter; setelah selesai nilai kolom
// harus UTUH dan fokus TETAP di kolom yang sama (gejala bug: hanya satu huruf lalu fokus hilang = komponen di-remount).
// Halaman: /login, /kontak, navbar cari, /berita cari, /staf/ganti-sandi, /staf/artikel/baru, /staf/pengurus (Tambah),
// /staf/program (Tambah), /staf/galeri (Tambah), /staf/pengguna (Tambah), /staf/pengaturan, /staf/pengaduan cari & detail catatan.
// Pemakaian: node uji-b0c-ketik.mjs [URL] [URL staf] [--produksi]
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
let gagal = 0, total = 0; const cek = (n, ok, k) => { total++; if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const daftarP = await (await fetch(`${US}/api/staf/pengaduan?perHalaman=1`, { headers: { cookie: `warkop_token=${TK}` } })).json(); const idP = daftarP.baris?.[0]?.id;
const port = 9640 + Math.floor(Math.random() * 40);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); const konsol = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } if (m.method === 'Runtime.exceptionThrown') konsol.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0].slice(0, 140)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') konsol.push(m.params.args.map((a) => a.value || a.description).join(' ').slice(0, 140)); };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const buka = async (url) => { await kirim('Page.navigate', { url }); await tidur(3500); };
const TEKS = 'Uji ketik 20+ karakter: aman & <ok> "kutip" 100%';
async function ketikSemua(nama, url, siapkan) {
  console.log(`\n## ${nama} — ${url}`);
  await buka(url); if (siapkan) { await ev(siapkan); await tidur(1200); }
  const kolom = await ev(`[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=date]):not([type=number]):not([readonly]):not([disabled]), textarea:not([disabled]), [contenteditable="true"]')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((el, i) => { el.setAttribute('data-ketik', String(i)); return { i, tag: el.tagName.toLowerCase(), tipe: el.type || '', maks: el.maxLength > 0 ? el.maxLength : 0, nama: el.name || el.id || el.getAttribute('aria-label') || el.getAttribute('placeholder') || 'contenteditable' }; })`);
  if (!kolom || !kolom.length) { cek(`${nama}: kolom ditemukan`, false, 'tidak ada kolom yang tampak'); return; }
  for (const k of kolom) {
    await ev(`(() => { const el = document.querySelector('[data-ketik="${k.i}"]'); el.scrollIntoView({ block: 'center' }); el.focus(); if (el.tagName !== 'DIV') { el.select && el.select(); } })()`);
    await tidur(120);
    let hilangFokusPada = -1;
    for (let c = 0; c < TEKS.length; c++) {
      const ch = TEKS[c];
      await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch });
      await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
      await tidur(25);
      if (c % 5 === 4) { const masihFokus = await ev(`document.activeElement === document.querySelector('[data-ketik="${k.i}"]')`); if (!masihFokus && hilangFokusPada < 0) { hilangFokusPada = c + 1; break; } }
    }
    const nilai = await ev(`(() => { const el = document.querySelector('[data-ketik="${k.i}"]'); return el ? (el.tagName === 'DIV' ? el.textContent : el.value) : null; })()`);
    const masihAda = nilai !== null; const harap = k.maks ? TEKS.slice(0, k.maks) : TEKS; const utuh = masihAda && String(nilai).endsWith(harap.slice(0, hilangFokusPada > 0 ? hilangFokusPada : harap.length)) && (hilangFokusPada < 0);
    cek(`${k.tag}${k.tipe ? '[' + k.tipe + ']' : ''} ${k.nama}`, utuh, hilangFokusPada > 0 ? `FOKUS HILANG setelah ${hilangFokusPada} karakter; nilai "${String(nilai).slice(-30)}"` : !masihAda ? 'elemen HILANG (remount)' : `nilai utuh (${String(nilai).length} karakter${k.maks ? ', maxLength ' + k.maks : ''})`);
  }
}
console.log(`# QA-2 B0c — audit ketik ≥ 20 karakter — ${U} — ${new Date().toISOString()}`);
await ketikSemua('login', `${US}/login`);
await ketikSemua('kontak (formulir pengaduan + cari navbar)', `${U}/kontak`, `(() => { const c = document.querySelector('input[type=checkbox][id*="anon"]'); if (c && c.checked) c.click(); })()`);
await ketikSemua('berita (cari + navbar)', `${U}/berita`);
await ketikSemua('lacak', `${U}/lacak`);
await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
await ketikSemua('ganti-sandi', `${US}/staf/ganti-sandi`);
await ketikSemua('editor artikel baru', `${US}/staf/artikel/baru`);
await ketikSemua('kelola artikel (cari)', `${US}/staf/artikel`);
await ketikSemua('kelola pengaduan (cari)', `${US}/staf/pengaduan`);
if (idP) await ketikSemua('detail pengaduan (catatan status)', `${US}/staf/pengaduan/${idP}`);
const klikTambah = `(() => { const b = [...document.querySelectorAll('button, a')].find(b => /tambah|baru/i.test(b.textContent) && !/artikel/i.test(b.textContent)); if (b) b.click(); return !!b; })()`;
await ketikSemua('pengurus (formulir tambah)', `${US}/staf/pengurus`, klikTambah);
await ketikSemua('program (formulir tambah)', `${US}/staf/program`, klikTambah);
await ketikSemua('galeri (formulir tambah)', `${US}/staf/galeri`, klikTambah);
await ketikSemua('pengguna (formulir tambah)', `${US}/staf/pengguna`, klikTambah);
await ketikSemua('pengaturan', `${US}/staf/pengaturan`);
ws.close(); chrome.kill();
console.log(`\nkonsol error selama audit: ${konsol.length}${konsol.length ? '\n  ' + konsol.slice(0, 8).join('\n  ') : ''}`);
console.log(`\nRINGKASAN B0c: ${total} kolom, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
