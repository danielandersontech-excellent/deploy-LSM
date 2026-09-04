#!/usr/bin/env node
// D6 Tahap 9 — aksesibilitas di Chrome headless (CDP): navigasi keyboard penuh (Tab menelusuri seluruh kontrol),
// fokus selalu terlihat (outline/box-shadow/ring pada :focus-visible), tautan lewati ke konten, formulir pengaduan bisa
// diisi & dikirim hanya dengan keyboard, label/aria pada setiap kontrol (pembaca layar), heading & landmark.
// Kontras WCAG AA diambil dari Lighthouse (D4, audit color-contrast). Pemakaian: node uji-d6-aksesibilitas.mjs [URL]
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as gabungJalur } from 'node:path';
// Profil Chrome sementara per run + dihapus saat keluar (QA-1: 162 profil HeadlessChrome* yatim memenuhi disk C: ±100 MB/run)
const PROFIL_CDP = mkdtempSync(gabungJalur(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL_CDP, { recursive: true, force: true }); } catch {} });
const U = process.argv[2] || 'http://localhost:3000';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync('laporan/bukti-tahap-09/tangkapan', { recursive: true });
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const port = 9950 + Math.floor(Math.random() * 40);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL_CDP}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable');
const ev = async (x) => { const q = await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return q.result?.result?.value; };
const tab = async (shift = false) => { for (const type of ['keyDown', 'keyUp']) await kirim('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: shift ? 8 : 0 }); await tidur(40); };
const ketik = async (teks) => { await kirim('Input.insertText', { text: teks }); await tidur(30); };
const tekan = async (key, code, vk) => { const text = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined; await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text, unmodifiedText: text }); await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); await tidur(80); };
const AKTIF = `(() => { const a = document.activeElement; if (!a || a === document.body) return null; const cs = getComputedStyle(a); const fv = a.matches(':focus-visible'); const terlihat = fv && (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none'); const r = a.getBoundingClientRect(); return { tag: a.tagName.toLowerCase(), tipe: a.type || '', nama: (a.getAttribute('aria-label') || a.labels?.[0]?.textContent || a.textContent || a.getAttribute('name') || a.id || '').replace(/\\s+/g,' ').trim().slice(0, 40), fokusTerlihat: terlihat, dalamLayar: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight, href: a.getAttribute('href') || '' }; })()`;
const foto = async (nama) => { const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`laporan/bukti-tahap-09/tangkapan/${nama}.png`, Buffer.from(f.result.data, 'base64')); };
console.log(`# D6 aksesibilitas — ${U} — ${new Date().toISOString()}`);

for (const jalur of ['/', '/berita', '/kontak', '/lacak', '/login']) {
  await kirim('Page.navigate', { url: `${U}${jalur}` }); await tidur(3500);
  console.log(`\n## ${jalur}`);
  const landmark = await ev(`({ header: !!document.querySelector('header'), nav: !!document.querySelector('nav'), main: !!document.querySelector('main'), footer: !!document.querySelector('footer'), h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, judul: document.title })`);
  cek('landmark & bahasa', (jalur === '/login' ? landmark.main : landmark.header && landmark.nav && landmark.main) && landmark.h1 >= 1 && landmark.lang === 'id', JSON.stringify(landmark) + (jalur === '/login' ? ' (halaman mandiri: hanya <main> + h1 yang diharapkan)' : ''));
  const lewati = await ev(`(() => { const a = document.querySelector('a[href="#konten-utama"], a[href^="#konten"], a.skip, a[class*="sr-only"]'); return a ? { teks: a.textContent.trim(), tujuanAda: !!document.querySelector(a.getAttribute('href')) } : null; })()`);
  if (jalur !== '/login') cek('tautan lewati ke konten', !!lewati && lewati.tujuanAda, JSON.stringify(lewati));
  const tanpaLabel = await ev(`[...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(el => !(el.labels && el.labels.length) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.getAttribute('title')).map(el => el.name || el.id || el.type)`);
  const tombolTanpaNama = await ev(`[...document.querySelectorAll('button, a[href]')].filter(el => !(el.textContent.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || el.querySelector('img[alt]'))).length`);
  const gambarTanpaAlt = await ev(`[...document.images].filter(i => !i.hasAttribute('alt')).length`);
  cek('kontrol berlabel, tombol/tautan bernama, gambar ber-alt', tanpaLabel.length === 0 && tombolTanpaNama === 0 && gambarTanpaAlt === 0, `tanpa label: [${tanpaLabel.join(',')}], tombol tanpa nama: ${tombolTanpaNama}, img tanpa alt: ${gambarTanpaAlt}`);
  // Tab menyeluruh
  const jumlahFokus = await ev(`[...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }).length`);
  const urutan = []; let tidakTerlihat = 0;
  await ev(`document.activeElement && document.activeElement.blur(); window.scrollTo(0,0); document.querySelectorAll('[data-d6]').forEach(e => e.removeAttribute('data-d6'))`);
  for (let i = 0; i < Math.min(jumlahFokus + 5, 160); i++) { await tab(); const a = await ev(AKTIF); if (!a) continue; const sudah = await ev(`document.activeElement.hasAttribute('data-d6') ? true : (document.activeElement.setAttribute('data-d6','1'), false)`); if (sudah) break; urutan.push(a); if (!a.fokusTerlihat) tidakTerlihat++; }
  cek(`Tab menjangkau ${urutan.length} dari ${jumlahFokus} kontrol yang tampak; fokus terlihat pada semua`, urutan.length >= Math.min(jumlahFokus, 100) * 0.95 && tidakTerlihat === 0, `fokus tidak terlihat: ${tidakTerlihat}${tidakTerlihat ? ' -> ' + urutan.filter((u) => !u.fokusTerlihat).map((u) => u.tag + ':' + u.nama).slice(0, 5).join(', ') : ''}`);
  console.log(`  urutan fokus (awal): ${urutan.slice(0, 8).map((u) => `${u.tag}${u.tipe ? '[' + u.tipe + ']' : ''}:${u.nama || u.href}`).join(' → ')}`);
}

console.log('\n## Formulir pengaduan (/kontak) diisi & dikirim hanya dengan keyboard');
await kirim('Page.navigate', { url: `${U}/kontak` }); await tidur(3500);
// lompat ke formulir: fokuskan elemen pertama form lalu Tab sesuai urutan DOM
await ev(`(() => { const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea')); const el = f.querySelector('input:not([type=hidden]), select, textarea, button'); el && el.focus(); })()`);
const isi = []; let selesaiForm = false;
for (let i = 0; i < 40 && !selesaiForm; i++) {
  const a = await ev(AKTIF); if (!a) break;
  if (a.tag === 'input' && a.tipe === 'checkbox') { const nama = a.nama.toLowerCase(); if (/anonim/.test(nama)) { const cek1 = await ev(`document.activeElement.checked`); if (!cek1) await tekan(' ', 'Space', 32); isi.push(`checkbox anonim: ${await ev('document.activeElement.checked')}`); } else { const c0 = await ev('document.activeElement.checked'); if (!c0) await tekan(' ', 'Space', 32); isi.push(`checkbox ${a.nama}: ${await ev('document.activeElement.checked')}`); } }
  else if (a.tag === 'select') { await ev(`(() => { const s = document.activeElement; const o = [...s.options].find(o => o.value); if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } })()`); isi.push(`select ${a.nama}: ${await ev('document.activeElement.value')}`); }
  else if (a.tag === 'textarea') { await ketik('Uji D6 Tahap 9: laporan diisi hanya dengan keyboard (Tab, ketik, Space, Enter) untuk memastikan pembaca layar dan pengguna keyboard dapat menyelesaikan formulir.'); isi.push(`textarea ${a.nama}: ${(await ev('document.activeElement.value.length'))} karakter`); }
  else if (a.tag === 'input' && ['text', 'email', 'tel', ''].includes(a.tipe)) { const n = a.nama.toLowerCase(); if (/lokasi/.test(n)) await ketik('Kantor Desa Uji, Bandung'); else if (/nama/.test(n)) await ketik('Pengguna Keyboard'); else if (/email/.test(n)) await ketik('keyboard@contoh.id'); else if (/telepon|hp/.test(n)) await ketik('081200000000'); isi.push(`input ${a.nama}: "${await ev('document.activeElement.value')}"`); }
  else if (a.tag === 'input' && a.tipe === 'file') { isi.push('input berkas dilewati (opsional)'); }
  else if (a.tag === 'button' && a.tipe === 'submit') { isi.push(`tombol kirim: "${a.nama}" -> Enter`); await foto('d6-kontak-sebelum-kirim'); await tekan('Enter', 'Enter', 13); selesaiForm = true; break; }
  await tab();
}
await tidur(4000);
const sesudah = await ev(`document.body.innerText.match(/WRP-\\d{6}/)?.[0] || (document.body.innerText.match(/wajib|harus|tidak sah|gagal|terlalu/i) ? 'VALIDASI: ' + document.body.innerText.match(/[^\\n]*(wajib|harus|tidak sah|gagal|terlalu)[^\\n]*/i)[0].slice(0, 100) : 'tidak ada nomor kasus')`);
await foto('d6-kontak-sesudah-kirim');
console.log('  ' + isi.join('\n  '));
cek('formulir dikirim dengan keyboard → nomor kasus tampil', /^WRP-/.test(sesudah), sesudah);
const nomorD6 = /^WRP-/.test(sesudah) ? sesudah : null;
// pesan status/aria-live
const live = await ev(`document.querySelectorAll('[aria-live], [role=status], [role=alert]').length`); cek('wilayah aria-live/role=status untuk umpan balik', live > 0, `${live} elemen`);
ws.close(); chrome.kill();
if (nomorD6) { const { kueri, tutupPool } = await import('../../../lib/db/index.js'); const { waktuSekarang } = await import('../../../lib/utils.js'); await kueri('UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus=? AND dihapus_pada IS NULL', [waktuSekarang(), waktuSekarang(), nomorD6]); await tutupPool(); console.log(`  pengaduan uji ${nomorD6} dihapus lunak`); }
console.log(`\nRINGKASAN D6: ${gagal === 0 ? 'LULUS' : `${gagal} GAGAL`} (kontras WCAG AA: lihat Lighthouse D4 audit color-contrast)`);
process.exit(0);
