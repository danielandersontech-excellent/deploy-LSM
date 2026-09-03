#!/usr/bin/env node
// =====================================================================
//  uji-kesetiaan.mjs — Uji kesetiaan tampilan terhadap desain Stitch
//
//  Membandingkan code.html dari Warkop_Nusantara.zip dengan HTML hasil
//  render Next.js, TANPA peramban. Melaporkan:
//    1. kelas Tailwind yang ada di desain tetapi tidak ada di render
//    2. teks tampak (judul, label, tombol) yang ada di desain tapi hilang
//    3. sisa cacat export: nama ikon Material sebagai teks, gambar
//       googleusercontent, CDN Tailwind, fonts.googleapis
//    4. token desain (warna/tipografi/jarak) yang dipakai desain tapi
//       tidak dipakai render
//
//  PEMAKAIAN
//    node uji-kesetiaan.mjs <code.html desain> <URL atau berkas HTML render> [--teks] [--json]
//
//    node uji-kesetiaan.mjs stitch/beranda_warkop_nusantara/code.html http://localhost:3000/
//    node uji-kesetiaan.mjs stitch/kelola_pengaduan_admin/code.html render-pengaduan.html --teks
//
//  Untuk halaman staf, ambil HTML render dengan cookie login:
//    curl -s -b "warkop_token=<jwt>" http://localhost:3000/staf/pengaduan > render-pengaduan.html
//
//  CARA MEMBACA HASIL
//    Angka cakupan kelas 100% tidak mungkin dan tidak diminta: header/footer
//    kanonik, kelas dark:, dan elemen yang menjadi .map() memang berbeda.
//    Yang dicari adalah DAFTAR kelas yang hilang — baca satu per satu dan
//    pastikan tiap yang hilang punya alasan (lihat REFERENSI bagian 18).
//    Kelas hilang tanpa alasan = tampilan menyimpang dari desain.
//
//  Exit code: 0 bila tidak ada sisa cacat export; 1 bila ada.
// =====================================================================

import { readFileSync } from 'node:fs';

const [, , jalurDesain, sumberRender, ...opsi] = process.argv;
if (!jalurDesain || !sumberRender) {
  console.error('Pemakaian: node uji-kesetiaan.mjs <code.html> <URL|berkas.html> [--teks] [--json]');
  process.exit(2);
}
const tampilkanTeks = opsi.includes('--teks');
const keluarJson = opsi.includes('--json');

async function bacaSumber(s) {
  if (/^https?:\/\//.test(s)) {
    const r = await fetch(s, { headers: { accept: 'text/html' } });
    if (!r.ok) throw new Error(`HTTP ${r.status} saat mengambil ${s}`);
    return await r.text();
  }
  return readFileSync(s, 'utf8');
}

// ---- pembantu ---------------------------------------------------------
const ABAIKAN_PREFIKS = ['dark:', 'group-', 'peer-'];
const ABAIKAN_KELAS = new Set(['docked', 'full-width', 'flat', 'texture-paper', 'Transition-all', 'material-symbols-outlined']);

function kelasDari(html) {
  const hasil = new Map(); // kelas -> jumlah
  for (const m of html.matchAll(/\bclass(?:Name)?="([^"]*)"/g)) {
    for (const k of m[1].trim().split(/\s+/)) {
      if (!k) continue;
      if (ABAIKAN_KELAS.has(k)) continue;
      if (ABAIKAN_PREFIKS.some((p) => k.startsWith(p))) continue;
      hasil.set(k, (hasil.get(k) || 0) + 1);
    }
  }
  return hasil;
}

function teksTampakDari(html) {
  // buang script/style, ambil teks di elemen yang biasanya membawa label desain
  const bersih = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const set = new Set();
  for (const m of bersih.matchAll(/<(h1|h2|h3|h4|h5|button|label|a|th|option|legend|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = m[2].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    // buang nama ikon yang bocor dan teks terlalu pendek/numerik
    if (t.length >= 3 && !/^[a-z_]+$/.test(t) && !/^[\d.,+%#\s-]+$/.test(t)) set.add(t);
  }
  return set;
}

const TOKEN_WARNA = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container', 'secondary', 'on-secondary',
  'secondary-container', 'on-secondary-container', 'secondary-fixed', 'secondary-fixed-dim', 'on-secondary-fixed',
  'on-secondary-fixed-variant', 'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
  'error', 'on-error', 'error-container', 'on-error-container', 'surface', 'surface-dim', 'surface-bright',
  'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high',
  'surface-container-highest', 'on-surface', 'on-surface-variant', 'surface-variant', 'surface-tint',
  'inverse-surface', 'inverse-on-surface', 'inverse-primary', 'outline', 'outline-variant', 'background',
  'on-background', 'primary-fixed', 'primary-fixed-dim', 'on-primary-fixed', 'on-primary-fixed-variant',
  'tertiary-fixed', 'tertiary-fixed-dim', 'on-tertiary-fixed', 'on-tertiary-fixed-variant',
];
const TOKEN_LAIN = [
  'headline-xl', 'headline-lg', 'headline-lg-mobile', 'headline-md', 'body-lg', 'body-md', 'label-md', 'motto',
  'container-max', 'margin-mobile', 'margin-desktop', 'unit', 'gutter',
];
function tokenDipakai(kelasMap) {
  const set = new Set();
  for (const k of kelasMap.keys()) {
    const inti = k.replace(/^(hover:|focus:|md:|lg:|sm:|xl:|focus-within:|active:|disabled:)+/, '');
    for (const t of TOKEN_WARNA) {
      if (new RegExp(`^(bg|text|border|ring|from|to|via|fill|stroke|divide|placeholder|outline|decoration|accent|shadow)-${t}(\\/\\d+)?$`).test(inti)) set.add(t);
    }
    for (const t of TOKEN_LAIN) {
      if (new RegExp(`^(font|text|max-w|w|px|py|p|gap|mx|my|m|pl|pr|pt|pb|space-x|space-y|h|min-h)-${t}$`).test(inti)) set.add(t);
    }
  }
  return set;
}

// ---- jalankan ---------------------------------------------------------
const desain = readFileSync(jalurDesain, 'utf8');
const render = await bacaSumber(sumberRender);

const kD = kelasDari(desain);
const kR = kelasDari(render);
const hilang = [...kD.keys()].filter((k) => !kR.has(k)).sort();
const ada = [...kD.keys()].filter((k) => kR.has(k));
const cakupan = kD.size ? Math.round((ada.length / kD.size) * 100) : 0;

const tD = tokenDipakai(kD);
const tR = tokenDipakai(kR);
const tokenHilang = [...tD].filter((t) => !tR.has(t)).sort();

const teksD = teksTampakDari(desain);
const teksR = teksTampakDari(render);
const teksRenderGabung = render.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const teksHilang = [...teksD].filter((t) => !teksR.has(t) && !teksRenderGabung.includes(t)).sort();

// Muatan RSC (self.__next_f) berisi salinan komponen bawaan Next.js (mis. not-found
// bawaan dengan height:100vh) — bukan CSS aplikasi. Dikeluarkan dari pemindaian cacat.
const renderTanpaFlight = render.replace(/<script[^>]*>[\s\S]*?self\.__next_f[\s\S]*?<\/script>/g, '');
const cacat = {
  ikonSebagaiTeks: (renderTanpaFlight.match(/material-symbols-outlined/g) || []).length,
  googleusercontent: (renderTanpaFlight.match(/googleusercontent\.com/g) || []).length,
  cdnTailwind: (renderTanpaFlight.match(/cdn\.tailwindcss\.com/g) || []).length,
  fontsGoogleapis: (renderTanpaFlight.match(/fonts\.googleapis\.com|fonts\.gstatic\.com/g) || []).length,
  important: (renderTanpaFlight.match(/!important/g) || []).length,
  seratusVh: (renderTanpaFlight.match(/100vh/g) || []).length,
  hrefKosong: (renderTanpaFlight.match(/href="#"/g) || []).length,
};
const adaCacat = Object.values(cacat).some((n) => n > 0);

const laporan = {
  desain: jalurDesain,
  render: sumberRender,
  kelas: { desain: kD.size, ditemukanDiRender: ada.length, cakupanPersen: cakupan, hilang },
  token: { desain: [...tD].sort(), hilangDiRender: tokenHilang },
  teks: { desain: teksD.size, hilang: teksHilang },
  cacatExport: cacat,
};

if (keluarJson) {
  console.log(JSON.stringify(laporan, null, 2));
} else {
  const garis = '-'.repeat(64);
  console.log(garis);
  console.log(`UJI KESETIAAN  desain=${jalurDesain}`);
  console.log(`               render=${sumberRender}`);
  console.log(garis);
  console.log(`Kelas desain       : ${kD.size}`);
  console.log(`Ditemukan di render: ${ada.length}  (${cakupan}%)`);
  console.log(`Kelas hilang       : ${hilang.length}`);
  if (hilang.length) console.log('  ' + hilang.join('\n  '));
  console.log(garis);
  console.log(`Token desain dipakai desain : ${tD.size}`);
  console.log(`Token hilang di render      : ${tokenHilang.length}${tokenHilang.length ? '  -> ' + tokenHilang.join(', ') : ''}`);
  console.log(garis);
  console.log(`Teks tampak desain : ${teksD.size}   hilang di render: ${teksHilang.length}`);
  if (tampilkanTeks && teksHilang.length) console.log('  ' + teksHilang.join('\n  '));
  else if (teksHilang.length) console.log('  (tambahkan --teks untuk melihat daftarnya)');
  console.log(garis);
  console.log('Sisa cacat export di render (semua HARUS 0):');
  for (const [k, v] of Object.entries(cacat)) console.log(`  ${k.padEnd(20)} ${v}${v > 0 ? '   <-- PERBAIKI' : ''}`);
  console.log(garis);
  console.log(adaCacat ? 'HASIL: ADA CACAT EXPORT YANG TERSISA' : 'HASIL: tidak ada cacat export tersisa. Periksa daftar kelas hilang di atas.');
}
process.exit(adaCacat ? 1 : 0);
