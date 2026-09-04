#!/usr/bin/env node
// scripts/buat-penampung.mjs — membangkitkan gambar PENAMPUNG lokal untuk konten contoh
// (REFERENSI 18.2b: foto contoh -> placeholder lokal bertema, bukan googleusercontent).
//
// QA-1 butir 3 (4 Sep 2026): dibangkitkan ULANG dengan gaya yang lebih halus & konsisten dengan token desain —
//   * tanpa teks (label "GAMBAR PENAMPUNG" sebelumnya pecah/terpotong di kartu sempit),
//   * latar gradasi lembut krem→cokelat muda (#faf9f5 → #e9dfd0) + garis diagonal emas sangat samar,
//   * lambang kecil di tengah dengan opasitas rendah (bukan logo besar pekat),
//   * rasio mengikuti SLOT-nya: artikel & program 16:9 (1200×675), galeri 4:3 (1200×900; galeri-1 = 1:1 untuk sel besar),
//     pengurus 1:1 (600×600, siluet orang), peta 3:2 (1200×800, pola kisi peta), hero program 4:3 (1200×900).
// Jalur mengikuti database/seed.sql (/penampung/artikel-N.jpg, galeri-N.jpg, pengurus-N.jpg, program-N.jpg) + tambahan
// peta-penampung.jpg, program-hero.jpg. `--paksa` menimpa berkas yang sudah ada (bawaan: lewati agar foto asli dari
// pemilik tidak tertimpa). Video galeri-3.mp4 TIDAK dibuat (tidak ada ffmpeg) — MENUNGGU PEMILIK.
//
//   node scripts/buat-penampung.mjs [--paksa]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TUJUAN = path.join(AKAR, 'public', 'penampung');
mkdirSync(TUJUAN, { recursive: true });
const PAKSA = process.argv.includes('--paksa');
const LOGO = readFileSync(path.join(AKAR, 'public', 'logo-warkop.png'));

// Variasi warna lembut per indeks agar kartu bertetangga tidak identik (semua dari keluarga token: krem, surface-container, cokelat muda)
const NADA = [['#faf9f5', '#e9dfd0'], ['#f5f1ea', '#e2d6c4'], ['#f7f3ec', '#dccdb8'], ['#f3efe6', '#e6dccb']];
const DAFTAR = [
  ...Array.from({ length: 12 }, (_, i) => ({ nama: `artikel-${i + 1}.jpg`, lebar: 1200, tinggi: 675, jenis: 'lambang', nada: i % 4 })),
  ...Array.from({ length: 6 }, (_, i) => ({ nama: `galeri-${i + 1}.jpg`, lebar: 1200, tinggi: i === 0 ? 1200 : 900, jenis: 'lambang', nada: (i + 1) % 4 })),
  ...Array.from({ length: 5 }, (_, i) => ({ nama: `pengurus-${i + 1}.jpg`, lebar: 600, tinggi: 600, jenis: 'siluet', nada: i % 2 })),
  ...Array.from({ length: 3 }, (_, i) => ({ nama: `program-${i + 1}.jpg`, lebar: 1200, tinggi: 675, jenis: 'lambang', nada: (i + 2) % 4 })),
  { nama: 'peta-penampung.jpg', lebar: 1200, tinggi: 800, jenis: 'peta', nada: 0 },
  { nama: 'program-hero.jpg', lebar: 1200, tinggi: 900, jenis: 'peta', nada: 1 },
];

function svgLatar({ lebar, tinggi, jenis, nada }) {
  const [a, b] = NADA[nada];
  const kisi = jenis === 'peta'
    ? `<g stroke="#8d6e63" stroke-opacity="0.18" stroke-width="1">${Array.from({ length: 13 }, (_, i) => `<line x1="${Math.round((lebar / 12) * i)}" y1="0" x2="${Math.round((lebar / 12) * i)}" y2="${tinggi}"/>`).join('')}${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${Math.round((tinggi / 8) * i)}" x2="${lebar}" y2="${Math.round((tinggi / 8) * i)}"/>`).join('')}</g>
       <path d="M ${lebar * 0.12} ${tinggi * 0.62} C ${lebar * 0.3} ${tinggi * 0.35}, ${lebar * 0.55} ${tinggi * 0.75}, ${lebar * 0.88} ${tinggi * 0.4}" fill="none" stroke="#e9c349" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
       <circle cx="${lebar * 0.5}" cy="${tinggi * 0.5}" r="${Math.min(lebar, tinggi) * 0.035}" fill="#271310" fill-opacity="0.75"/>
       <circle cx="${lebar * 0.5}" cy="${tinggi * 0.5}" r="${Math.min(lebar, tinggi) * 0.07}" fill="none" stroke="#271310" stroke-opacity="0.35" stroke-width="3"/>`
    : `<pattern id="d" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="48" stroke="#e9c349" stroke-opacity="0.14" stroke-width="2"/></pattern><rect width="100%" height="100%" fill="url(#d)"/>`;
  const siluet = jenis === 'siluet'
    ? `<g fill="#8d6e63" fill-opacity="0.55"><circle cx="${lebar / 2}" cy="${tinggi * 0.38}" r="${tinggi * 0.16}"/><path d="M ${lebar * 0.18} ${tinggi * 1.02} C ${lebar * 0.18} ${tinggi * 0.68}, ${lebar * 0.82} ${tinggi * 0.68}, ${lebar * 0.82} ${tinggi * 1.02} Z"/></g>`
    : '';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lebar}" height="${tinggi}" viewBox="0 0 ${lebar} ${tinggi}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${kisi}
  ${siluet}
</svg>`);
}

let dibuat = 0, dilewati = 0;
for (const g of DAFTAR) {
  const jalur = path.join(TUJUAN, g.nama);
  if (existsSync(jalur) && !PAKSA) { dilewati++; continue; }
  const lapisan = [];
  if (g.jenis === 'lambang') {
    // lambang kecil (22 % sisi terpendek) dengan opasitas rendah, sedikit di atas pusat
    const sisi = Math.round(Math.min(g.lebar, g.tinggi) * 0.22);
    const logo = await sharp(LOGO).resize(sisi, sisi, { fit: 'inside' }).ensureAlpha().linear([1, 1, 1, 0.28], [0, 0, 0, 0]).png().toBuffer();
    lapisan.push({ input: logo, left: Math.round((g.lebar - sisi) / 2), top: Math.round((g.tinggi - sisi) / 2), blend: 'over' });
  }
  const buf = await sharp(svgLatar(g)).composite(lapisan).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  writeFileSync(jalur, buf);
  dibuat++;
}
console.log(`[penampung] dibuat ${dibuat}, dilewati ${dilewati}, folder ${path.relative(AKAR, TUJUAN)}${PAKSA ? ' (--paksa)' : ''}`);
