// lib/db/kategoriProgram.js — RUN QA-3 F: kategori program menjadi DINAMIS (tabel kategori_program).
// Kolom program.kategori tetap berisi SLUG (relasi lama aman); tabel ini adalah daftar slug yang sah
// beserta labelnya. Pemilik menambah kategori lewat formulir program ("Kategori Lainnya...").
import { kueri } from './index.js';
import slugify from 'slugify';

export async function ambilKategoriProgram() {
  return kueri(`SELECT id, nama, slug, ikon, urutan FROM kategori_program ORDER BY urutan, nama`);
}

export async function ambilKategoriProgramBySlug(slug) {
  const baris = await kueri(`SELECT id, nama, slug, ikon, urutan FROM kategori_program WHERE slug = ? LIMIT 1`, [String(slug)]);
  return baris[0] ?? null;
}

/** Slug dari nama; sama caranya dengan slug artikel (paket slugify sudah diizinkan cetak biru 4). */
export function slugKategoriProgram(nama) {
  return slugify(String(nama), { lower: true, strict: true, locale: 'id' }).slice(0, 50);
}

/**
 * Menambah kategori baru bila slugnya belum ada; bila sudah ada, baris yang ada itulah yang dipakai
 * (mencegah duplikat "Bantuan Hukum" / "bantuan hukum" / "Bantuan  Hukum").
 * @returns {{baris: object, baru: boolean}}
 */
export async function pastikanKategoriProgram(nama) {
  const slug = slugKategoriProgram(nama);
  const ada = await ambilKategoriProgramBySlug(slug);
  if (ada) return { baris: ada, baru: false };
  const urutan = (await kueri(`SELECT IFNULL(MAX(urutan), 0) + 1 AS u FROM kategori_program`))[0].u;
  await kueri(`INSERT INTO kategori_program (nama, slug, ikon, urutan) VALUES (?, ?, 'explore', ?)`, [String(nama).trim(), slug, Number(urutan) || 1]);
  return { baris: await ambilKategoriProgramBySlug(slug), baru: true };
}
