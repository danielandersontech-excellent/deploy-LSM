#!/usr/bin/env node
// scripts/buat-penampung.mjs — membangkitkan gambar PENAMPUNG lokal bertema untuk konten contoh
// (REFERENSI 18.2b: foto contoh -> placeholder lokal bertema, bukan googleusercontent).
// Jalur mengikuti sql/02-seed.sql (/penampung/artikel-N.jpg, galeri-N.jpg, pengurus-N.jpg,
// program-N.jpg). Warna dari token desain: cokelat #271310/#3e2723, emas #e9c349/#ffe088,
// krem #faf9f5. Idempoten: berkas yang sudah ada dilewati (pemilik boleh menggantinya).
// Memakai `sharp` (paket yang diizinkan CLAUDE.md aturan 4). Video galeri-3.mp4 TIDAK dibuat
// (tidak ada ffmpeg; kartu video memakai thumbnail galeri-3.jpg) — dicatat di laporan.
//
//   node scripts/buat-penampung.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TUJUAN = path.join(AKAR, 'public', 'penampung');
mkdirSync(TUJUAN, { recursive: true });

const LOGO = readFileSync(path.join(AKAR, 'public', 'logo-warkop.png'));

const DAFTAR = [
  ...Array.from({ length: 12 }, (_, i) => ({ nama: `artikel-${i + 1}.jpg`, lebar: 1200, tinggi: 800, label: 'BERITA &amp; INVESTIGASI', latar: i % 2 ? '#3e2723' : '#271310' })),
  ...Array.from({ length: 6 }, (_, i) => ({ nama: `galeri-${i + 1}.jpg`, lebar: 1200, tinggi: i === 0 ? 1200 : 800, label: 'DOKUMENTASI KEGIATAN', latar: i % 2 ? '#3a2922' : '#3e2723' })),
  ...Array.from({ length: 5 }, (_, i) => ({ nama: `pengurus-${i + 1}.jpg`, lebar: 600, tinggi: 600, label: 'PENGURUS', latar: '#271310' })),
  ...Array.from({ length: 3 }, (_, i) => ({ nama: `program-${i + 1}.jpg`, lebar: 1200, tinggi: 800, label: 'PROGRAM &amp; KEGIATAN', latar: i % 2 ? '#3e2723' : '#3a2922' })),
];

function svgLatar({ lebar, tinggi, label, latar }) {
  const ukuranLabel = Math.round(Math.min(lebar, tinggi) / 22);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lebar}" height="${tinggi}" viewBox="0 0 ${lebar} ${tinggi}">
  <rect width="100%" height="100%" fill="${latar}"/>
  <rect x="24" y="24" width="${lebar - 48}" height="${tinggi - 48}" fill="none" stroke="#e9c349" stroke-opacity="0.35" stroke-width="3"/>
  <text x="50%" y="${tinggi - Math.round(tinggi * 0.09)}" text-anchor="middle" font-family="Fira Sans, Arial, sans-serif" font-size="${ukuranLabel}" letter-spacing="4" fill="#ffe088" fill-opacity="0.9">${label} · GAMBAR PENAMPUNG</text>
</svg>`);
}

let dibuat = 0, dilewati = 0;
for (const g of DAFTAR) {
  const jalur = path.join(TUJUAN, g.nama);
  if (existsSync(jalur)) { dilewati++; continue; }
  const sisi = Math.round(Math.min(g.lebar, g.tinggi) * 0.42);
  const logo = await sharp(LOGO).resize(sisi, sisi, { fit: 'inside' }).png().toBuffer();
  const buf = await sharp(svgLatar(g))
    .composite([{ input: logo, left: Math.round((g.lebar - sisi) / 2), top: Math.round((g.tinggi - sisi) / 2 - g.tinggi * 0.05), blend: 'over' }])
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  writeFileSync(jalur, buf);
  dibuat++;
}
console.log(`[penampung] dibuat ${dibuat}, dilewati ${dilewati}, folder ${path.relative(AKAR, TUJUAN)}`);
