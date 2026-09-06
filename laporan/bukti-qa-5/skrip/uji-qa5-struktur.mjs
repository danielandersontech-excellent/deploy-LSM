#!/usr/bin/env node
// RUN QA-5 — bukti tata letak PIRAMIDA bagan /struktur (KEPUTUSAN PEMILIK).
//   1. Tangkapan per kelompok (Dewan, Pengurus DPP, Direktorat, Satgas) pada 1280 dan 375 (+768 ringkas) ->
//      laporan/bukti-qa-5/tangkapan/<awalan>-<kelompok>-<lebar>.png  (awalan "sebelum" = build lama, "sesudah"/"produksi").
//   2. --periksa : geometri piramida pada md ke atas (768, 1280) untuk SETIAP blok [data-piramida]:
//        baris 1 = satu kartu di tengah; baris 2 (bila ada) = satu kartu di tengah tepat di bawah baris 1;
//        baris berikutnya kiri -> kanan urut data-urutan, tiap baris di tengah, maks perBaris kartu; garis penghubung
//        [data-garis] tampak antar baris; di 375 semua kartu menumpuk satu kolom urut data-urutan dan garis tersembunyi.
//      Bentuk baris dibandingkan dengan HARAPAN per kelompok (--harapan=lokal|produksi) supaya bukan menguji kode
//      dengan kode itu sendiri.
//   3. Sapu konsol /struktur pada 375/768/1280: galat konsol, permintaan >= 400, gulir mendatar, kontrol tumpang
//      tindih, em/en dash tampil harus nol.
// Profil Chrome sementara dibuat dan DIHAPUS saat keluar. Pemakaian:
//   node laporan/bukti-qa-5/skrip/uji-qa5-struktur.mjs [URL] [awalan] [--periksa] [--harapan=lokal|produksi]
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000';
const awalan = argv[1] || 'lokal';
const PERIKSA = process.argv.includes('--periksa');
const HARAPAN_NAMA = (process.argv.find((a) => a.startsWith('--harapan=')) || '--harapan=lokal').slice(10);
const KELUAR = 'laporan/bukti-qa-5/tangkapan';
mkdirSync(KELUAR, { recursive: true });
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch { /* abaikan */ } });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let gagal = 0; const catat = (ok, pesan) => { if (!ok) gagal++; console.log(`${ok ? 'LULUS' : 'GAGAL'}  ${pesan}`); };

// Bentuk baris yang DIHARAPKAN per blok (jumlah kartu per baris, dari atas ke bawah), sesuai data:
//  lokal    = laporan/bukti-qa-5/skrip/data-uji-lokal.sql ; produksi = SELECT pengurus produksi 5 Sep 2026.
const HARAPAN = {
  lokal: {
    'Dewan Pembina': [1, 1], 'Dewan Penasehat': [1, 1, 3], 'Dewan Pengawas': [1, 2], // Pengawas: urutan 1,3,4 -> baris kedua dilewati
    'Pengurus DPP': [1, 1, 2], 'Hukum dan Advokasi': [1], 'Investigasi': [1, 1, 2, 1], 'Humas dan Kerja Sama Antar Lembaga': [1, 1],
    'Media': [1], 'Satuan Tugas (Satgas)': [1, 1, 3, 1],
  },
  produksi: {
    'Dewan Pembina': [1, 1], 'Dewan Penasehat': [1], 'Dewan Pengawas': [1], 'Pengurus DPP': [1, 1, 2],
    'Hukum dan Advokasi': [1], 'Humas dan Kerja Sama Antar Lembaga': [1, 1], 'Media': [1], 'Satuan Tugas (Satgas)': [1],
  },
}[HARAPAN_NAMA] || {};

const port = 9500 + Math.floor(Math.random() * 90);
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
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;

const KELOMPOK = [['dewan', 'judul-dewan'], ['dpp', 'judul-dpp'], ['direktorat', 'judul-direktorat'], ['satgas', 'judul-satgas']];

const UKUR = `(() => {
  const iw = document.documentElement.clientWidth;
  const kontrol = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'); });
  const tumpang = [];
  for (let i = 0; i < kontrol.length; i++) for (let k = i + 1; k < kontrol.length; k++) {
    if (kontrol[i].contains(kontrol[k]) || kontrol[k].contains(kontrol[i])) continue;
    const a = kontrol[i].getBoundingClientRect(), b = kontrol[k].getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)); const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    if (ix * iy > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || 'x').trim().slice(0, 16) + ' x ' + (kontrol[k].textContent || 'x').trim().slice(0, 16));
  }
  const sy = window.scrollY;
  const bagian = {};
  for (const [nama, idJudul] of ${JSON.stringify(KELOMPOK)}) {
    const j = document.getElementById(idJudul); const s = j ? j.closest('section') : null;
    if (s) { const r = s.getBoundingClientRect(); bagian[nama] = { x: 0, y: Math.round(r.top + sy), w: iw, h: Math.round(r.height) }; }
  }
  const piramida = [...document.querySelectorAll('[data-piramida]')].map(p => {
    const rp = p.getBoundingClientRect();
    const judul = (p.getAttribute('data-piramida') || '').trim();
    const baris = [...p.querySelectorAll('[data-baris]')].map(b => {
      const rb = b.getBoundingClientRect();
      const kartu = [...b.querySelectorAll('[data-urutan]')].map(k => { const r = k.getBoundingClientRect(); return { urutan: Number(k.getAttribute('data-urutan')), kiri: Math.round(r.left), kanan: Math.round(r.right), atas: Math.round(r.top + sy), bawah: Math.round(r.bottom + sy), tengah: Math.round((r.left + r.right) / 2) }; });
      return { atas: Math.round(rb.top + sy), bawah: Math.round(rb.bottom + sy), kiri: Math.round(rb.left), kanan: Math.round(rb.right), kartu };
    });
    const garis = [...p.querySelectorAll('[data-garis]')].map(g => ({ tampak: g.offsetParent !== null && g.getBoundingClientRect().height > 0, tinggi: Math.round(g.getBoundingClientRect().height), tengah: Math.round((g.getBoundingClientRect().left + g.getBoundingClientRect().right) / 2) }));
    return { judul, perBaris: Number(p.getAttribute('data-per-baris') || 0), kiri: Math.round(rp.left), kanan: Math.round(rp.right), tengah: Math.round((rp.left + rp.right) / 2), baris, garis };
  });
  return { iw, gulirMendatar: document.documentElement.scrollWidth > iw + 1, tumpang: tumpang.slice(0, 3), dash: /[\\u2014\\u2013]/.test(document.body.innerText),
    teksGalat: /Application error|Internal Server Error|Terjadi kesalahan tak terduga/.test(document.body.innerText), tinggi: document.documentElement.scrollHeight, bagian, piramida };
})()`;

console.log(`# QA-5 — bagan piramida /struktur — ${U} — awalan ${awalan} — ${PERIKSA ? 'periksa geometri (harapan ' + HARAPAN_NAMA + ')' : 'tangkapan saja'} — ${new Date().toISOString()}`);
for (const [w, h, mobile] of [[1280, 900, false], [768, 1024, true], [375, 812, true]]) {
  await kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  konsol = []; jaringan = [];
  await kirim('Page.navigate', { url: `${U}/struktur` }); await tidur(3000);
  // gulir sampai bawah agar gambar lazy termuat, lalu kembali ke atas
  await ev('(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); return true; })()');
  await tidur(800);
  const r = await ev(UKUR);
  console.log(`\n## ${w}px  (tinggi halaman ${r.tinggi}px)`);
  catat(!r.teksGalat, `${w}: tanpa teks galat`);
  catat(konsol.length === 0, `${w}: galat konsol = ${konsol.length}${konsol.length ? ' -> ' + konsol.slice(0, 3).join(' | ') : ''}`);
  catat(jaringan.length === 0, `${w}: permintaan >= 400 = ${jaringan.length}${jaringan.length ? ' -> ' + jaringan.slice(0, 3).join(' | ') : ''}`);
  catat(!r.gulirMendatar, `${w}: gulir mendatar = ${r.gulirMendatar ? 'ADA' : 'tidak'}`);
  catat(r.tumpang.length === 0, `${w}: kontrol tumpang tindih = ${r.tumpang.length}${r.tumpang.length ? ' -> ' + r.tumpang.join(' | ') : ''}`);
  catat(!r.dash, `${w}: em/en dash tampil = ${r.dash ? 'ADA' : 'tidak'}`);

  // tangkapan per kelompok (1280 & 375 wajib; 768 hanya dpp sebagai ringkasan)
  for (const [nama] of KELOMPOK) {
    const b = r.bagian[nama]; if (!b) { console.log(`  (bagian ${nama} tidak ditemukan pada ${w})`); continue; }
    if (w === 768 && nama !== 'dpp') continue;
    const tinggi = Math.min(b.h + 8, 16000);
    const tangkap = await kirim('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: Math.max(0, b.y - 4), width: w, height: tinggi, scale: 1 } });
    if (tangkap.result?.data) { writeFileSync(join(KELUAR, `${awalan}-${nama}-${w}.png`), Buffer.from(tangkap.result.data, 'base64')); console.log(`  tangkapan ${awalan}-${nama}-${w}.png (${w}x${tinggi})`); }
    else console.log(`  GAGAL tangkap ${nama} ${w}: ${JSON.stringify(tangkap.error || tangkap).slice(0, 120)}`);
  }

  if (!PERIKSA) continue;
  catat(r.piramida.length > 0, `${w}: blok piramida ditemukan = ${r.piramida.length}`);
  for (const p of r.piramida) {
    const label = `${w} [${p.judul}]`;
    const semuaKartu = p.baris.flatMap((b) => b.kartu);
    const urutanNaik = semuaKartu.every((k, i) => i === 0 || k.urutan >= semuaKartu[i - 1].urutan);
    catat(urutanNaik, `${label}: urutan kartu dalam DOM menaik (${semuaKartu.map((k) => k.urutan).join(',')})`);
    const bentuk = p.baris.map((b) => b.kartu.length);
    const harap = HARAPAN[p.judul];
    if (harap) catat(JSON.stringify(bentuk) === JSON.stringify(harap), `${label}: bentuk baris ${JSON.stringify(bentuk)} = harapan ${JSON.stringify(harap)}`);
    if (w >= 768) {
      // baris menumpuk vertikal, tiap baris di tengah blok, kartu kiri -> kanan
      let ok = true; const alasan = [];
      p.baris.forEach((b, i) => {
        if (i > 0 && b.atas < p.baris[i - 1].bawah) { ok = false; alasan.push(`baris ${i + 1} tidak di bawah baris ${i}`); }
        const tengahBaris = Math.round((Math.min(...b.kartu.map((k) => k.kiri)) + Math.max(...b.kartu.map((k) => k.kanan))) / 2);
        if (Math.abs(tengahBaris - p.tengah) > 2) { ok = false; alasan.push(`baris ${i + 1} tidak di tengah (${tengahBaris} vs ${p.tengah})`); }
        if (b.kartu.length > p.perBaris) { ok = false; alasan.push(`baris ${i + 1} berisi ${b.kartu.length} > ${p.perBaris}`); }
        for (let k = 1; k < b.kartu.length; k++) if (b.kartu[k].kiri < b.kartu[k - 1].kanan) { ok = false; alasan.push(`baris ${i + 1} kartu ${k + 1} tidak di kanan kartu ${k}`); }
        const atasSama = b.kartu.every((k) => Math.abs(k.atas - b.kartu[0].atas) <= 1);
        if (!atasSama) { ok = false; alasan.push(`baris ${i + 1} kartu tidak sejajar atas`); }
      });
      if (p.baris.length >= 1 && p.baris[0].kartu.length !== 1) { ok = false; alasan.push('baris 1 bukan satu kartu'); }
      if (p.baris.length >= 2 && p.baris[1].kartu.length === 1 && Math.abs(p.baris[1].kartu[0].tengah - p.baris[0].kartu[0].tengah) > 2) { ok = false; alasan.push('baris 2 tidak tepat di bawah baris 1'); }
      catat(ok, `${label}: geometri piramida md+${alasan.length ? ' -> ' + alasan.join('; ') : ''}`);
      const garisOk = p.garis.length === Math.max(0, p.baris.length - 1) && p.garis.every((g) => g.tampak && g.tinggi === 48 && Math.abs(g.tengah - p.tengah) <= 2);
      catat(garisOk, `${label}: garis penghubung ${p.garis.length} buah (harus ${Math.max(0, p.baris.length - 1)}), tampak, tinggi 48, di tengah`);
    } else {
      // < md : satu kolom, menumpuk urut, garis tersembunyi
      let ok = true; const alasan = [];
      semuaKartu.forEach((k, i) => {
        if (i > 0 && k.atas < semuaKartu[i - 1].bawah) { ok = false; alasan.push(`kartu ${i + 1} tidak di bawah kartu ${i}`); }
        if (Math.abs(k.kiri - semuaKartu[0].kiri) > 1 || Math.abs(k.kanan - semuaKartu[0].kanan) > 1) { ok = false; alasan.push(`kartu ${i + 1} tidak sekolom`); }
      });
      catat(ok, `${label}: menumpuk satu kolom urut${alasan.length ? ' -> ' + alasan.join('; ') : ''}`);
      catat(p.garis.every((g) => !g.tampak), `${label}: garis penghubung tersembunyi (${p.garis.length} buah)`);
    }
  }
}
ws.close(); chrome.kill();
console.log(`\nRINGKASAN QA-5 (${awalan}): ${gagal === 0 ? 'LULUS' : `GAGAL ${gagal} butir`}; tangkapan di ${KELUAR}/${awalan}-*.png`);
process.exit(gagal === 0 ? 0 : 1);
