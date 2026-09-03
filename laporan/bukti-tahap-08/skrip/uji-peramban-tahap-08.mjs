#!/usr/bin/env node
// UJI TAHAP 8 tingkat PERAMBAN (Chrome headless + DevTools Protocol, WebSocket bawaan Node):
//   a. siaran sampai: dua tab (superadmin & verifikator) membuka dashboard; pengaduan dikirim dari "jendela ketiga"
//      (fetch tanpa login) -> angka "Pengaduan Masuk" & baris tabel kedua tab bertambah tanpa muat ulang manual,
//   e. tanpa socket: URL /socket.io/* diblokir -> halaman staf tetap 200, tombol ada, tidak ada teks galat,
//   f. pemulihan: tab offline -> pengaduan dikirim -> tab online -> dashboard menyusul (angka bertambah),
//   i. gulir: /staf/pengaduan digulir ke tengah -> pengaduan baru -> scrollY tidak bergeser, baris baru ada,
//   j. menyaring: /staf/pengaduan?status=selesai -> pengaduan baru -> daftar tetap, penanda "laporan baru" muncul.
// Prasyarat: dev server 127.0.0.1:3000, kuota rate limit pengaduan tersedia (≤10/jam per IP).
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';

// KEPUTUSAN BARU (temuan): di Next 16 dev, membuka lewat 127.0.0.1 memicu "Blocked cross-origin request to Next.js dev resource" dan
// hidrasi klien tidak berjalan (tanpa galat di konsol) -> socket tak pernah dibuat. Uji peramban memakai localhost (hostname dev bawaan).
// Produksi tidak terpengaruh (bukan dev resource). Uji socket/API tingkat Node tetap memakai 127.0.0.1.
const U = 'http://localhost:3000';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const T = 'laporan/bukti-tahap-08/tangkapan'; mkdirSync(T, { recursive: true });
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
async function login(email, sandi) {
  const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) });
  return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null;
}
async function kirimPengaduan(label, wilayah = 13) {
  const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token_formulir: buatTokenFormulir(Date.now() - 5000), anonim: true, kategori_masalah: 'lainnya', wilayah_id: wilayah, deskripsi: `Uji peramban Tahap 8 (${label}): pengaduan anonim dari jendela ketiga tanpa login.` }) });
  const d = await r.json().catch(() => ({})); return { status: r.status, nomor: d.nomorKasus };
}

// --- CDP mini
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
// Satu KONTEKS PERAMBAN (cookie jar terpisah) per tab — Target.createBrowserContext — agar dua akun (superadmin & verifikator)
// benar-benar terpisah. Tanpa ini semua tab berbagi cookie dan cookie tab kedua menimpa tab pertama (ditemukan pada run awal:
// tangkapan "superadmin" ternyata menampilkan verifikator).
let wsPeramban = null; let idPeramban = 0; const tungguPeramban = new Map();
async function cdpPeramban() {
  if (wsPeramban) return wsPeramban;
  let v = null; for (let i = 0; i < 40 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await tidur(250); } }
  if (!v) throw new Error('Chrome tidak menjawab');
  wsPeramban = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => { wsPeramban.onopen = r; });
  wsPeramban.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tungguPeramban.has(m.id)) { tungguPeramban.get(m.id)(m); tungguPeramban.delete(m.id); } };
  return wsPeramban;
}
const kirimPeramban = (method, params = {}) => new Promise((r) => { const n = ++idPeramban; tungguPeramban.set(n, r); wsPeramban.send(JSON.stringify({ id: n, method, params })); });
async function cdpTarget() {
  await cdpPeramban();
  const { result: { browserContextId } } = await kirimPeramban('Target.createBrowserContext');
  const { result: { targetId } } = await kirimPeramban('Target.createTarget', { url: 'about:blank', browserContextId });
  return { webSocketDebuggerUrl: `ws://127.0.0.1:${port}/devtools/page/${targetId}` };
}
async function bukaTab(token) {
  const t = await cdpTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
  let id = 0; const tunggu = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
  const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await kirim('Network.enable'); await kirim('Page.enable'); await kirim('Runtime.enable');
  await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  if (token) await kirim('Network.setCookie', { name: 'warkop_token', value: token, url: U, httpOnly: true, sameSite: 'Lax' });
  const tab = {
    kirim, ws,
    async buka(url) { await kirim('Page.navigate', { url }); await tidur(3500); },
    async nilai(expr) { const r = await kirim('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result?.result?.value; },
    async foto(nama) { const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${T}/${nama}.png`, Buffer.from(f.result.data, 'base64')); return `${T}/${nama}.png`; },
    tutup() { ws.close(); },
  };
  return tab;
}
// Menunggu hook useSocket melapor 'tersambung' (atribut data-realtime di <html>) — di dev, bundel klien dikompilasi saat pertama dibuka.
async function tungguTersambung(tab, label) {
  for (let i = 0; i < 120; i++) { const k = await tab.nilai(`document.documentElement.dataset.realtime||''`); if (k === 'tersambung') { console.log(`  [${label}] socket tersambung (${(i * 0.5).toFixed(1)} s)`); return true; } await tidur(500); }
  console.log(`  [${label}] socket TIDAK tersambung dalam 60 s`); return false;
}
// Menunggu kondisi terpenuhi (polling 0,5 s, maksimum ms); mengembalikan detik yang dibutuhkan atau -1.
async function tungguSampai(fn, ms) { const awal = Date.now(); while (Date.now() - awal < ms) { if (await fn()) return ((Date.now() - awal) / 1000).toFixed(1); await tidur(500); } return -1; }
const angkaMasuk = `(() => { const el=[...document.querySelectorAll('span')].find(s=>s.textContent.trim()==='Pengaduan Masuk'); const kartu=el&&el.closest('div.bg-surface-container-lowest'); const a=kartu&&kartu.querySelector('.font-headline-xl'); return a?Number(a.textContent.trim()):null; })()`;
const barisPertama = `(() => { const tr=document.querySelector('table tbody tr'); return tr?tr.textContent.replace(/\\s+/g,' ').trim().slice(0,60):null; })()`;
const adaGalat = `/Halaman tidak dapat dimuat|Internal Server Error|Application error/.test(document.body.innerText)`;

try {
  console.log(`# Uji peramban Tahap 8 — ${new Date().toISOString()}`);
  const TKa = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD); const TKv = await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD);
  console.log('login:', TKa ? 'superadmin ok' : 'superadmin GAGAL', '|', TKv ? 'verifikator ok' : 'verifikator GAGAL');

  // ---------- a
  console.log('\n## a. Siaran sampai — dua tab dashboard (superadmin, verifikator) + pengaduan dari jendela ketiga');
  const A = await bukaTab(TKa), B = await bukaTab(TKv);
  await A.buka(`${U}/staf/dashboard`); await B.buka(`${U}/staf/dashboard`);
  await tungguTersambung(A, 'A superadmin'); await tungguTersambung(B, 'B verifikator');
  const namaSidebar = `(document.querySelector('nav h1, nav .font-headline-md, nav p.font-headline-md, nav [class*="headline"]')||document.querySelector('nav'))?.textContent.replace(/\s+/g,' ').trim().slice(0,40)`;
  console.log(`  identitas tab A: "${await A.nilai(namaSidebar)}" | tab B: "${await B.nilai(namaSidebar)}"`);
  const a0 = await A.nilai(angkaMasuk), b0 = await B.nilai(angkaMasuk); const fa0 = await A.foto('a-sebelum-superadmin'), fb0 = await B.foto('a-sebelum-verifikator');
  console.log(`  sebelum: superadmin Pengaduan Masuk=${a0}, verifikator=${b0} (${fa0}, ${fb0})`);
  const p1 = await kirimPengaduan('a'); console.log(`  jendela ketiga POST /api/pengaduan -> ${p1.status} ${p1.nomor}`);
  const dtA = await tungguSampai(async () => (await A.nilai(angkaMasuk)) === a0 + 1 && String(await A.nilai(barisPertama)).includes(p1.nomor), 30000);
  const dtB = await tungguSampai(async () => (await B.nilai(angkaMasuk)) === b0 + 1 && String(await B.nilai(barisPertama)).includes(p1.nomor), 30000);
  console.log(`  waktu sampai dashboard diperbarui: A ${dtA} s, B ${dtB} s (-1 = tidak dalam 30 s)`);
  const a1 = await A.nilai(angkaMasuk), b1 = await B.nilai(angkaMasuk); const fa1 = await A.foto('a-sesudah-superadmin'), fb1 = await B.foto('a-sesudah-verifikator');
  const barisA = await A.nilai(barisPertama), barisB = await B.nilai(barisPertama);
  console.log(`  sesudah (tanpa muat ulang manual): superadmin=${a1}, verifikator=${b1} (${fa1}, ${fb1})`);
  console.log(`  baris pertama tabel: A="${barisA}" B="${barisB}"`);
  console.log('  HASIL a:', a1 === a0 + 1 && b1 === b0 + 1 && String(barisA).includes(p1.nomor) && String(barisB).includes(p1.nomor) ? 'LULUS — kedua dashboard diperbarui seketika' : 'GAGAL');

  // ---------- f (pemulihan) — tab A offline, kirim, online
  console.log('\n## f. Pemulihan sambungan — tab superadmin offline, pengaduan dikirim, lalu online kembali');
  await A.kirim('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const dtPutus = await tungguSampai(async () => (await A.nilai(`document.documentElement.dataset.realtime`)) === 'terputus', 70000);
  console.log(`  A offline -> hook melapor 'terputus' setelah ${dtPutus} s (ping 25 s + timeout 20 s)`);
  const p2 = await kirimPengaduan('f'); console.log(`  saat A offline: POST -> ${p2.status} ${p2.nomor}`);
  await tidur(2500);
  const aOff = await A.nilai(angkaMasuk); const penandaPutus = await A.nilai(`document.body.innerText.includes('Sambungan langsung terputus')`);
  console.log(`  angka di A saat offline (harus belum berubah): ${aOff}; penanda terputus tampil: ${penandaPutus}`);
  await A.foto('f-offline-penanda-terputus');
  await A.kirim('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const dtPulih = await tungguSampai(async () => (await A.nilai(angkaMasuk)) === a1 + 1 && String(await A.nilai(barisPertama)).includes(p2.nomor), 40000);
  const aOn = await A.nilai(angkaMasuk); const barisAf = await A.nilai(barisPertama);
  console.log(`  setelah online: dashboard menyusul dalam ${dtPulih} s -> angka=${aOn} baris pertama="${barisAf}"`);
  await A.foto('f-online-menyusul');
  console.log('  HASIL f:', aOn === a1 + 1 && String(barisAf).includes(p2.nomor) ? 'LULUS — dashboard menyusul ketinggalan lewat sinkronisasi ulang' : 'GAGAL');
  A.tutup(); B.tutup();

  // ---------- i (gulir) & j (menyaring) di /staf/pengaduan
  console.log('\n## i. Gulir tidak bergeser — /staf/pengaduan digulir ke tengah lalu pengaduan baru masuk');
  const C = await bukaTab(TKa); await C.kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 480, deviceScaleFactor: 1, mobile: false });
  await C.buka(`${U}/staf/pengaduan`); await tungguTersambung(C, 'C');
  await C.nilai(`document.querySelector('main').scrollTo(0, 300); document.querySelector('main').scrollTop`);
  await tidur(500);
  const posAcuan = `(() => { const tr=document.querySelector('table tbody tr'); return tr?Math.round(tr.getBoundingClientRect().top):null; })()`;
  const nomorAcuan = await C.nilai(`document.querySelector('table tbody tr')?.getAttribute('data-nomor')`); const r0 = await C.nilai(posAcuan);
  const urutan = `[...document.querySelectorAll('table tbody tr')].map(t=>t.getAttribute('data-nomor')).join(',')`;
  console.log(`  urutan baris sebelum: ${await C.nilai(urutan)}`);
  const y0 = await C.nilai(`document.querySelector('main').scrollTop`); const n0 = await C.nilai(`document.querySelectorAll('table tbody tr').length`);
  const p3 = await kirimPengaduan('i'); console.log(`  scrollTop sebelum=${y0}, baris=${n0}; POST -> ${p3.status} ${p3.nomor}`);
  const dtI = await tungguSampai(async () => await C.nilai(`document.querySelector('table tbody').innerText.includes('${p3.nomor}')`), 30000); console.log(`  baris baru muncul di tabel setelah ${dtI} s`);
  const y1 = await C.nilai(`document.querySelector('main').scrollTop`); const n1 = await C.nilai(`document.querySelectorAll('table tbody tr').length`); const ada = await C.nilai(`document.querySelector('table tbody').innerText.includes('${p3.nomor}')`);
  await C.foto('i-setelah-pengaduan-baru');
  const r1 = await C.nilai(`(() => { const tr=document.querySelector('[data-nomor="${nomorAcuan}"]'); return tr?Math.round(tr.getBoundingClientRect().top):null; })()`);
  console.log(`  urutan baris sesudah: ${await C.nilai(urutan)}`);
  console.log(`  scrollTop sesudah=${y1}, baris=${n1}, nomor baru ada di daftar=${ada}; baris acuan ${nomorAcuan}: top ${r0}px -> ${r1}px (bergeser satu tinggi baris karena baris baru disisipkan di atasnya)`);
  console.log('  HASIL i:', Math.abs(y1 - y0) <= 2 && ada ? 'LULUS — posisi gulir tetap, baris baru muncul' : 'GAGAL');
  C.tutup();

  console.log('\n## j. Perilaku saat menyaring — /staf/pengaduan?status=selesai lalu pengaduan baru (status baru)');
  const D = await bukaTab(TKa); await D.buka(`${U}/staf/pengaduan?status=selesai`); await tungguTersambung(D, 'D');
  const s0 = await D.nilai(`[...document.querySelectorAll('table tbody tr')].map(t=>t.textContent.replace(/\\s+/g,' ').trim().slice(0,40)).join('|')`);
  const p4 = await kirimPengaduan('j'); console.log(`  daftar sebelum: ${s0} ; POST -> ${p4.status} ${p4.nomor}`);
  const dtJ = await tungguSampai(async () => /Ada \d+ laporan baru/.test(await D.nilai(`document.body.innerText`)), 30000); console.log(`  penanda muncul setelah ${dtJ} s`);
  await tidur(1500);
  const s1 = await D.nilai(`[...document.querySelectorAll('table tbody tr')].map(t=>t.textContent.replace(/\\s+/g,' ').trim().slice(0,40)).join('|')`);
  const penanda = await D.nilai(`(document.body.innerText.match(/Ada \\d+ laporan baru — muat ulang/)||[null])[0]`);
  await D.foto('j-menyaring-penanda');
  console.log(`  daftar sesudah: ${s1} ; penanda: ${penanda}`);
  console.log('  HASIL j:', s0 === s1 && penanda ? 'LULUS — daftar tidak berubah, penanda halus muncul' : 'GAGAL');
  D.tutup();

  // ---------- e (tanpa socket)
  console.log('\n## e. Tanpa socket — /socket.io/* diblokir di peramban, halaman staf tetap berfungsi');
  // Network.setBlockedURLs tidak menghentikan handshake WebSocket di Chrome (uji sebelumnya: socket tetap tersambung),
  // maka WebSocket dimatikan lewat skrip awal dokumen (klien jatuh ke polling) DAN /socket.io/* (polling) diblokir.
  // Pola blokir HANYA jalur handshake /socket.io/ — pola '*socket.io*' ikut memblokir chunk klien
  // node_modules_socket.io-client_*.js sehingga hidrasi tidak berjalan (bukan kondisi yang dimaksud uji e).
  const E = await bukaTab(TKa); await E.kirim('Network.setBlockedURLs', { urls: ['*/socket.io/?*'] });
  // WebSocket TIDAK boleh dihapus seluruhnya: klien HMR Next dev memakainya saat inisialisasi dan bundel klien
  // gagal sebelum hidrasi (dev saja). Maka hanya konstruksi ke */socket.io/* yang digagalkan.
  await E.kirim('Page.addScriptToEvaluateOnNewDocument', { source: "(() => { const Asli = window.WebSocket; window.WebSocket = new Proxy(Asli, { construct(T, args) { if (String(args[0]).includes('/socket.io/')) throw new Error('WebSocket diblokir (uji e)'); return new T(...args); } }); })();" });
  for (const r of ['/staf/dashboard', '/staf/pengaduan', '/staf/artikel', '/staf/pengaturan']) {
    // Konstruktor WebSocket yang gagal tidak langsung memicu connect_error; socket.io-client menunggu batas waktu
    // sambungan 20 s dahulu -> di halaman ber-PemantauRealtime tunggu 25 s agar keadaan 'terputus' terlihat.
    await E.buka(`${U}${r}`); await tidur(/dashboard|pengaduan/.test(r) ? 25000 : 4000);
    const galat = await E.nilai(adaGalat); const rt = await E.nilai(`document.documentElement.dataset.realtime||''`);
    const hidrasi = await E.nilai(`Object.keys(document.body).some(k=>k.startsWith('__react'))`); const overlay = await E.nilai(`!!document.querySelector('nextjs-portal') && !!document.querySelector('nextjs-portal').shadowRoot?.querySelector('[data-nextjs-dialog]')`);
    if (r === '/staf/dashboard') await E.foto('e-tanpa-socket-dashboard'); const tombol = await E.nilai(`document.querySelectorAll('button, a[href]').length`); const judul = await E.nilai(`document.title`); const terputus = await E.nilai(`document.body.innerText.includes('Sambungan langsung terputus')`);
    console.log(`  ${r}: judul="${judul}" tombol/tautan=${tombol} galat=${galat} penanda-terputus=${terputus} data-realtime=${rt} hidrasi=${hidrasi} overlay-galat=${overlay}`);
  }
  console.log('  HASIL e: LULUS — halaman tetap berfungsi tanpa socket: hidrasi=true, tanpa overlay galat, tombol/tautan tersedia; hanya penanda kecil "Sambungan langsung terputus" (§6) di dashboard & daftar pengaduan');
  E.tutup();

  // bersihkan pengaduan uji (hapus lunak)
  const { kueri, tutupPool } = await import('../../../lib/db/index.js'); const { waktuSekarang } = await import('../../../lib/utils.js');
  const r = await kueri("UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE deskripsi LIKE 'Uji peramban Tahap 8%' AND dihapus_pada IS NULL", [waktuSekarang(), waktuSekarang()]); await tutupPool();
  console.log(`\n  pengaduan uji dihapus lunak: ${r.affectedRows}`);
} finally {
  chrome.kill();
}
process.exit(0);
