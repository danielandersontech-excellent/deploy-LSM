#!/usr/bin/env node
// QA-2 C2 — INTERAKSI: di tiap halaman, KLIK setiap elemen interaktif yang tampak (tautan internal, tombol, tab/pil, filter,
// paginasi, hamburger, dialog) dan KETIK penuh setiap kolom (≥ 20 karakter, karakter khusus aman) — perilaku wajar:
// tidak ada exception konsol, tidak ada 500, fokus bertahan, tombol kirim dinonaktifkan saat proses (diperiksa pada formulir
// yang dikirim: login salah, pengaduan), klik dua kali cepat pada tombol kirim tidak menghasilkan dua kiriman.
// Tautan diklik lalu KEMBALI (history.back) agar halaman tetap; tombol yang membuka dialog konfirmasi ditutup lewat Escape/Batal.
// Tombol destruktif (Hapus/Keluar/Paksa keluar/Reset/Terbitkan/Kirim/Simpan) TIDAK dieksekusi (dilewati, dicatat).
// Pemakaian: node uji-c2-interaksi.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-')); process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let gagal = 0, total = 0; const cek = (n, ok, k) => { total++; if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const r0 = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r0.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const j = async (p) => { try { return await (await fetch(`${US}${p}`, { headers: { cookie: `warkop_token=${TK}` } })).json(); } catch { return {}; } };
const slug = (await (await fetch(`${U}/api/artikel?perHalaman=1`)).json()).baris?.[0]?.slug; const idA = (await j('/api/staf/artikel?perHalaman=1')).baris?.[0]?.id; const idP = (await j('/api/staf/pengaduan?perHalaman=1')).baris?.[0]?.id;
const port = 9200 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); let konsol = [], gagalMuat = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split('\n')[0].slice(0, 120));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 120));
  if (m.method === 'Network.responseReceived' && p.response.status >= 500) gagalMuat.push(`${p.response.status} ${p.response.url.slice(0, 80)}`);
  if (m.method === 'Page.javascriptDialogOpening') { ws.send(JSON.stringify({ id: ++id, method: 'Page.handleJavaScriptDialog', params: { accept: false } })); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
if (TK) await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const buka = async (url) => { await kirim('Page.navigate', { url }); await tidur(3000); };
const klikXY = async (x, y, ganda = false) => { for (let i = 0; i < (ganda ? 2 : 1); i++) { await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); } };
const tekan = async (key, code, vk, text) => { await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text, unmodifiedText: text }); await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); };
const DESTRUKTIF = /hapus|keluar|paksa|reset|terbitkan|kirim|simpan|arsip|ubah status|tugaskan|logout|masuk sistem/i;
const TEKS = 'Uji C2 <b>&"tanda"</b> 100% \'aman\' 12345';
async function ujiHalaman(nama, url) {
  console.log(`\n## ${nama} — ${url}`);
  await buka(url); konsol = []; gagalMuat = [];
  const asal = await ev('location.href');
  // --- elemen interaktif
  const elemen = await ev(`(() => { const out = []; const semua = [...document.querySelectorAll('a[href], button, [role=button], [role=tab], summary')]; semua.forEach((el, i) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]') || el.hasAttribute('aria-hidden')) return; const href = el.getAttribute('href') || ''; if (/^(mailto|tel|http)/.test(href) && !href.startsWith(location.origin)) return; if (el.getAttribute('target') === '_blank') return; el.setAttribute('data-c2', String(i)); out.push({ i, tag: el.tagName.toLowerCase(), teks: (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40), href, tipe: el.getAttribute('type') || '' }); }); return out; })()`);
  let diklik = 0, dilewati = 0;
  for (const el of elemen) {
    if (DESTRUKTIF.test(el.teks) && (el.tag === 'button' || el.tipe === 'submit')) { dilewati++; continue; }
    const pos = await ev(`(() => { const el = document.querySelector('[data-c2="${el.i}"]'); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); if (r.width < 4) return null; return { x: r.left + Math.min(r.width / 2, 40), y: r.top + r.height / 2 }; })()`);
    if (!pos) continue;
    const sebelum = konsol.length + gagalMuat.length;
    await klikXY(pos.x, pos.y); await tidur(el.tag === 'a' ? 1500 : 700); diklik++;
    const kini = await ev('location.href');
    if (kini !== asal) { await kirim('Page.navigate', { url: asal }); await tidur(2500); }
    else { // dialog/laci terbuka? tutup dengan Escape
      await tekan('Escape', 'Escape', 27); await tidur(200);
      const tutup = await ev(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(batal|tutup)$/i.test(b.textContent.trim()) && b.getBoundingClientRect().width > 0); if (b) { b.click(); return true; } return false; })()`); if (tutup) await tidur(300);
    }
    if (konsol.length + gagalMuat.length > sebelum) console.log(`    ! setelah klik ${el.tag} "${el.teks}" ${el.href}: ${[...konsol, ...gagalMuat].slice(-2).join(' | ')}`);
  }
  // --- kolom teks: ketik penuh
  const kolom = await ev(`(() => { const out = []; [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=date]):not([type=number]):not([readonly]):not([disabled]), textarea:not([disabled]), [contenteditable="true"]')].forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { el.setAttribute('data-c2k', String(i)); out.push({ i, nama: el.name || el.id || el.getAttribute('aria-label') || 'kolom', maks: el.maxLength > 0 ? el.maxLength : 0, div: el.tagName === 'DIV' }); } }); return out; })()`);
  let ketikOk = 0, ketikGagal = 0;
  for (const k of kolom) {
    await ev(`(() => { const el = document.querySelector('[data-c2k="${k.i}"]'); el.scrollIntoView({ block: 'center' }); el.focus(); if (!el.isContentEditable) { el.select && el.select(); } })()`); await tidur(60);
    let hilang = false;
    for (let c = 0; c < TEKS.length; c++) { const ch = TEKS[c]; await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); if (c % 8 === 7 && !(await ev(`document.activeElement === document.querySelector('[data-c2k="${k.i}"]')`))) { hilang = true; break; } }
    const nilai = await ev(`(() => { const el = document.querySelector('[data-c2k="${k.i}"]'); return el ? (el.isContentEditable ? el.textContent : el.value) : null; })()`);
    const harap = k.maks ? TEKS.slice(0, k.maks) : TEKS;
    if (!hilang && nilai !== null && String(nilai).endsWith(harap)) ketikOk++; else { ketikGagal++; console.log(`    ! kolom ${k.nama}: ${hilang ? 'fokus hilang' : 'nilai "' + String(nilai).slice(-30) + '"'}`); }
  }
  cek(`${nama}: ${diklik} klik (${dilewati} destruktif dilewati), ${ketikOk}/${kolom.length} kolom utuh`, ketikGagal === 0 && konsol.length === 0 && gagalMuat.length === 0, `${konsol.length ? 'konsol: ' + konsol.slice(0, 2).join(' | ') : ''}${gagalMuat.length ? ' 5xx: ' + gagalMuat.slice(0, 2).join(' | ') : ''}`);
}
console.log(`# QA-2 C2 — interaksi & ketik penuh — ${U} — ${new Date().toISOString()}`);
for (const p of ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', `/berita/${slug}`, '/lacak', '/faq']) await ujiHalaman(`publik ${p}`, `${U}${p}`);
for (const p of ['/staf/dashboard', '/staf/artikel', '/staf/artikel/baru', `/staf/artikel/${idA}`, '/staf/pengaduan', `/staf/pengaduan/${idP}`, '/staf/pengurus', '/staf/program', '/staf/galeri', '/staf/pengguna', '/staf/pengaturan', '/staf/ganti-sandi']) await ujiHalaman(`staf ${p}`, `${US}${p}`);

// --- tombol kirim dinonaktifkan saat proses & klik ganda tidak mengirim dua kali
console.log('\n## Kirim: dinonaktifkan saat proses & klik ganda');
await kirim('Network.clearBrowserCookies'); await buka(`${US}/login`); konsol = [];
await ev(`(() => { const set = (s, v) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }; set('#staff-id', 'tidak.ada@contoh.id'); set('#password', 'salah-sekali-123'); })()`);
await ev(`window.__kirimC2 = 0; const asli = window.fetch; window.fetch = (...a) => { if (String(a[0]).includes('/api/auth/login')) window.__kirimC2++; return asli(...a); }; true`);
const posKirim = await ev(`(() => { const b = document.querySelector('form button[type=submit]'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
await klikXY(posKirim.x, posKirim.y, true); await tidur(50);
const disabledSaat = await ev(`!!document.querySelector('form button[type=submit]')?.disabled`); await tidur(3000);
const jumlahKirim = await ev('window.__kirimC2'); const pesan = await ev(`document.querySelector('[role=alert]')?.textContent || ''`);
cek('login: tombol kirim disabled saat proses; klik ganda → 1 permintaan; pesan galat tampil', disabledSaat && jumlahKirim === 1 && /tidak sesuai|Terlalu banyak/i.test(pesan), `disabled=${disabledSaat}, permintaan=${jumlahKirim}, pesan="${pesan.slice(0, 60)}"`);
await buka(`${U}/kontak`); konsol = [];
await ev(`(() => { const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea')); const set = (el, v) => { const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }; const anon = f.querySelector('input[type=checkbox][id*="anon"]'); if (anon && !anon.checked) anon.click(); const kat = f.querySelector('select[name="kategori_masalah"]'); set(kat, [...kat.options].find(o => o.value)?.value); const wil = f.querySelector('select[name="wilayah_id"]'); if (wil) set(wil, [...wil.options].find(o => o.value)?.value); set(f.querySelector('textarea'), 'Uji C2 QA-2: klik ganda tombol kirim pengaduan tidak boleh menghasilkan dua laporan; dihapus lunak setelah uji.'); window.__kirimC2 = 0; const asli = window.fetch; window.fetch = (...a) => { if (String(a[0]).includes('/api/pengaduan') && (a[1]?.method || 'GET') === 'POST') window.__kirimC2++; return asli(...a); }; return true; })()`);
const posKirim2 = await ev(`(() => { const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea')); const b = [...f.querySelectorAll('button[type=submit]')].pop(); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
await klikXY(posKirim2.x, posKirim2.y, true); await tidur(60);
const disabled2 = await ev(`(() => { const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea')); const b = [...f.querySelectorAll('button[type=submit]')].pop(); return !!b?.disabled; })()`);
let nomor = null; for (let i = 0; i < 12; i++) { await tidur(700); nomor = await ev(`document.body.innerText.match(/WRP-\\d{6}/)?.[0] || null`); if (nomor) break; }
const jumlah2 = await ev('window.__kirimC2');
cek('pengaduan: tombol kirim disabled saat proses; klik ganda → 1 kiriman; nomor kasus tampil', disabled2 && jumlah2 === 1 && !!nomor, `disabled=${disabled2}, POST=${jumlah2}, nomor=${nomor}`);
ws.close(); chrome.kill();
if (nomor) { if (!PROD) { const { kueri, tutupPool } = await import('../../../lib/db/index.js'); const { waktuSekarang } = await import('../../../lib/utils.js'); await kueri('UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus=? AND dihapus_pada IS NULL', [waktuSekarang(), waktuSekarang(), nomor]); await tutupPool(); console.log(`  pengaduan uji ${nomor} dihapus lunak`); } else console.log(`  NOMOR_UJI=${nomor} (produksi: hapus lunak lewat SQL)`); }
console.log(`\nRINGKASAN C2: ${total} pemeriksaan, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
