#!/usr/bin/env node
// QA-3 C + D1 — bukti visual & ukuran navbar dan footer pada beberapa lebar layar.
//   C  : navbar tanpa "Masuk Staff" harus rapi (tanpa gulir mendatar, tanpa kontrol tumpang tindih,
//         menu tetap satu baris) pada 1280 / 1366 / 1440 / 1920.
//   D1 : latar footer harus membentang PENUH sampai tepi layar pada 375 / 768 / 1280 / 1920,
//         sedangkan isinya tetap berada di dalam kontainer (tidak menempel tepi).
// Profil Chrome sementara dibuat dan DIHAPUS saat keluar.
// Pemakaian: node laporan/bukti-qa-3/skrip/tangkap-navbar-footer.mjs [URL] [nama-berkas]
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const U = process.argv[2] || 'http://localhost:3000';
const awalan = process.argv[3] || 'lokal';
const KELUAR = 'laporan/bukti-qa-3/tangkapan';
mkdirSync(KELUAR, { recursive: true });
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch { /* abaikan */ } });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let gagal = 0;

const port = 9700 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
if (!t) { console.log('GAGAL: Chrome tidak dapat dijalankan'); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); let konsol = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (m.params.exceptionDetails.exception?.description || '').split(String.fromCharCode(10))[0].slice(0, 120));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') konsol.push('console.error ' + m.params.args.map((a) => a.value ?? '').join(' ').slice(0, 120)); };
const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable');
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;

const PERIKSA = `(() => {
  // clientWidth = lebar TANPA batang gulir; innerWidth ikut menghitung batang gulir sehingga
  // elemen selebar layar akan terlihat 15 px lebih sempit dan disalahartikan sebagai tidak penuh.
  const iw = document.documentElement.clientWidth;
  const f = document.querySelector('footer');
  const rf = f.getBoundingClientRect();
  const isi = f.firstElementChild ? f.firstElementChild.getBoundingClientRect() : null;
  const nav = document.querySelector('header nav[aria-label="Navigasi utama"]');
  const rn = nav ? nav.getBoundingClientRect() : null;
  // Baris menu dihitung dari TITIK TENGAH vertikal: item yang teksnya membungkus dua baris lebih tinggi,
  // sehingga posisi atasnya berbeda meskipun semuanya sebaris (items-center).
  const item = nav ? [...nav.querySelectorAll('a')].map(a => { const r = a.getBoundingClientRect(); return { teks: a.textContent.trim().slice(0, 20), tengah: Math.round((r.top + r.bottom) / 2), kanan: Math.round(r.right) }; }) : [];
  const cari = document.querySelector('header form[role=search] input');
  const rcMentah = cari ? cari.getBoundingClientRect() : null;
  const rc = rcMentah && rcMentah.width > 0 ? rcMentah : null; // kotak cari disembunyikan di bawah lg
  // kontrol navbar yang tumpang tindih lebih dari seperempat luas terkecil
  const kontrol = [...document.querySelectorAll('header a[href], header button, header input')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const tumpang = [];
  for (let i = 0; i < kontrol.length; i++) for (let k = i + 1; k < kontrol.length; k++) {
    if (kontrol[i].contains(kontrol[k]) || kontrol[k].contains(kontrol[i])) continue;
    const a = kontrol[i].getBoundingClientRect(), b = kontrol[k].getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    if (ix * iy > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || 'x').trim().slice(0, 14) + ' x ' + (kontrol[k].textContent || 'x').trim().slice(0, 14));
  }
  return {
    iw,
    gulirMendatar: document.documentElement.scrollWidth > iw + 1,
    footerKiri: Math.round(rf.left), footerLebar: Math.round(rf.width),
    isiKiri: isi ? Math.round(isi.left) : null, isiLebar: isi ? Math.round(isi.width) : null,
    // "isi tetap di dalam kontainer" = kontainer punya padding kiri/kanan DAN lebarnya tidak melebihi 1280.
    isiPadKiri: isi ? Math.round(parseFloat(getComputedStyle(f.firstElementChild).paddingLeft) || 0) : 0,
    isiAnakKiri: f.firstElementChild?.firstElementChild ? Math.round(f.firstElementChild.firstElementChild.getBoundingClientRect().left) : null,
    adaMasukStaff: /Masuk Staff/.test(document.body.innerText),
    navBaris: item.length ? new Set(item.map(i => i.tengah)).size : 0,
    navKananMaks: item.length ? Math.max(...item.map(i => i.kanan)) : 0,
    cariKiri: rc ? Math.round(rc.left) : null,
    tumpang: tumpang.slice(0, 3),
    navTinggi: rn ? Math.round(rn.height) : 0,
  };
})()`;

console.log(`# QA-3 C+D1 — navbar & footer pada beberapa lebar — ${U} — ${new Date().toISOString()}`);
console.log('| lebar | gulir mendatar | "Masuk Staff" | baris menu | menu kanan vs kotak cari | tumpang tindih | footer kiri/lebar | isi kiri/lebar |');
console.log('|---|---|---|---|---|---|---|---|');
for (const [w, h] of [[375, 812], [768, 1024], [1280, 900], [1366, 900], [1440, 900], [1920, 1080]]) {
  await kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  konsol = [];
  await kirim('Page.navigate', { url: `${U}/` });
  await tidur(2600);
  await ev('window.scrollTo(0, document.body.scrollHeight)'); await tidur(600);
  const r = await ev(PERIKSA);
  const footerPenuh = r.footerKiri === 0 && r.footerLebar === r.iw;
  // isi tidak menempel tepi: ada padding kontainer, dan lebar isi tidak melebihi lebar kontainer maks (1280)
  const isiDiKontainer = r.isiPadKiri > 0 && r.isiAnakKiri > 0 && r.isiLebar <= Math.min(r.iw, 1280) + 1;
  const menuAman = r.navKananMaks === 0 || r.cariKiri === null || r.navKananMaks <= r.cariKiri;
  const ok = !r.gulirMendatar && !r.adaMasukStaff && footerPenuh && isiDiKontainer && r.tumpang.length === 0 && menuAman && konsol.length === 0;
  if (!ok) gagal++;
  console.log(`| ${w} | ${r.gulirMendatar ? 'ADA (buruk)' : 'tidak'} | ${r.adaMasukStaff ? 'MASIH ADA (buruk)' : 'tidak ada'} | ${r.navBaris || '-'} | ${r.navKananMaks || '-'} vs ${r.cariKiri ?? '-'} ${menuAman ? 'aman' : 'BERTABRAKAN'} | ${r.tumpang.length ? r.tumpang.join('; ') : 'tidak ada'} | ${r.footerKiri}/${r.footerLebar} ${footerPenuh ? 'PENUH' : 'TIDAK PENUH'} | ${r.isiAnakKiri}/${r.isiLebar} (padding ${r.isiPadKiri}) ${isiDiKontainer ? 'di kontainer' : 'MENEMPEL TEPI'} |`);
  const tangkap = await kirim('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(KELUAR, `${awalan}-beranda-${w}.png`), Buffer.from(tangkap.result.data, 'base64'));
  if (konsol.length) console.log(`  galat konsol ${w}px: ${konsol.slice(0, 2).join(' | ')}`);
}
ws.close(); chrome.kill();
console.log(`\nRINGKASAN C+D1 (${awalan}): ${gagal === 0 ? 'LULUS' : `GAGAL pada ${gagal} lebar`}; tangkapan di ${KELUAR}/${awalan}-beranda-*.png`);
process.exit(0);
