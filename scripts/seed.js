#!/usr/bin/env node
// scripts/seed.js — mengisi data awal. IDEMPOTEN: aman dijalankan berulang.
//
// Urutan:
//   1. Superadmin dari SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (hash bcrypt).
//      Bila sudah ada: kata sandi TIDAK diubah (kecuali SEED_RESET_ADMIN=1).
//   2. database/seed.sql — data statis (INSERT IGNORE / NOT EXISTS), dijalankan
//      lewat lib/db jalankanSkripSql(). Skrip ini TIDAK menulis SQL sendiri.
//   3. Akun staf contoh diaktifkan hanya bila SEED_STAF_PASSWORD terisi.
//   4. Perpindahan status pengaduan contoh lewat ubahStatusPengaduan()
//      (buku besar) — hanya bila pengaduan masih 'baru' dengan 1 riwayat.
//
// Prasyarat: skema sudah dijalankan secara sadar (sql/01-schema.sql).
// Kata sandi TIDAK PERNAH dicetak ke log.

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { tutupPool, hitungTabelAda, hitungBaris, jalankanSkripSql } from '../lib/db/index.js';
import { cariUserByEmail, buatUser, setelUlangSuperadmin, aktifkanAkunContoh } from '../lib/db/users.js';
import { ubahStatusPengaduan, ambilIdByNomor, ambilRiwayat } from '../lib/db/pengaduan.js';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BCRYPT_PUTARAN = 12;

const STAF_CONTOH = [
  'budi.santoso@warkopnusantara.id',
  'siti.rahma@warkopnusantara.id',
  'siti.aminah@warkopnusantara.id',
  'redaksi@warkopnusantara.id',
  'rahmat.siregar@warkopnusantara.id',
];

// Perpindahan status pengaduan contoh (nomor -> urutan status setelah 'baru')
const TRANSISI_CONTOH = {
  'WRP-009018': [
    { status: 'diverifikasi', catatan: 'Bukti awal lengkap; laporan diverifikasi.' },
    { status: 'diproses', catatan: 'Diteruskan ke tim advokasi wilayah untuk klarifikasi ke instansi terkait.' },
  ],
  'WRP-008994': [
    { status: 'diverifikasi', catatan: 'Foto kerusakan sesuai dengan laporan warga.' },
    { status: 'diproses', catatan: 'Surat permintaan tindak lanjut dikirim ke pemerintah desa dan dinas terkait.' },
    { status: 'selesai', catatan: 'Perbaikan jembatan dimulai; pelapor mengonfirmasi.' },
  ],
};

function wajibEnv(nama) {
  const nilai = process.env[nama];
  if (!nilai) {
    console.error(`[seed] ENV ${nama} wajib diisi (lihat .env.example).`);
    process.exit(1);
  }
  return nilai;
}

async function pastikanSkemaAda() {
  const ada = await hitungTabelAda(['users', 'pengaduan', 'pengaduan_riwayat', 'artikel']);
  if (ada < 4) {
    console.error('[seed] Skema belum ada. Jalankan dulu sql/01-schema.sql secara sadar (lihat PENERAPAN.md).');
    process.exit(1);
  }
}

async function seedSuperadmin() {
  const email = wajibEnv('SEED_ADMIN_EMAIL').trim().toLowerCase();
  const kataSandi = wajibEnv('SEED_ADMIN_PASSWORD');
  const ada = await cariUserByEmail(email);
  if (ada) {
    if (process.env.SEED_RESET_ADMIN === '1') {
      const hash = await bcrypt.hash(kataSandi, BCRYPT_PUTARAN);
      await setelUlangSuperadmin(ada.id, hash);
      console.log(`[seed] superadmin ${email} sudah ada — kata sandi DISETEL ULANG (SEED_RESET_ADMIN=1).`);
    } else {
      console.log(`[seed] superadmin ${email} sudah ada — dilewati.`);
    }
    return ada.id;
  }
  const hash = await bcrypt.hash(kataSandi, BCRYPT_PUTARAN);
  const id = await buatUser({ nama: 'Superadmin', email, kataSandiHash: hash, peran: 'superadmin', wilayahId: null, aktif: 1 });
  console.log(`[seed] superadmin ${email} dibuat (id ${id}).`);
  return id;
}

async function jalankanSeedSql() {
  const sql = readFileSync(path.join(AKAR, 'database', 'seed.sql'), 'utf8');
  await jalankanSkripSql(sql);
  console.log('[seed] database/seed.sql dijalankan.');
}

async function aktifkanStafContoh() {
  const kataSandi = process.env.SEED_STAF_PASSWORD;
  if (!kataSandi) {
    console.log('[seed] SEED_STAF_PASSWORD kosong — 5 akun staf contoh dibiarkan NONAKTIF (tidak bisa masuk).');
    return;
  }
  const hash = await bcrypt.hash(kataSandi, BCRYPT_PUTARAN);
  let diaktifkan = 0;
  for (const email of STAF_CONTOH) {
    const u = await cariUserByEmail(email);
    if (!u) continue;
    if (u.kata_sandi_hash === '!') diaktifkan += await aktifkanAkunContoh(u.id, hash);
  }
  console.log(`[seed] akun staf contoh diaktifkan: ${diaktifkan} (yang sudah punya kata sandi dilewati).`);
}

async function transisiPengaduanContoh(superadminId) {
  const verifikator = await cariUserByEmail('siti.aminah@warkopnusantara.id');
  const olehUserId = verifikator?.id ?? superadminId;
  for (const [nomor, langkah] of Object.entries(TRANSISI_CONTOH)) {
    const p = await ambilIdByNomor(nomor);
    if (!p) continue;
    const riwayat = await ambilRiwayat(p.id);
    if (p.status !== 'baru' || riwayat.length !== 1) {
      console.log(`[seed] ${nomor} sudah berstatus '${p.status}' dengan ${riwayat.length} riwayat — dilewati.`);
      continue;
    }
    for (const l of langkah) {
      await ubahStatusPengaduan(p.id, { statusBaru: l.status, catatan: l.catatan, olehUserId });
    }
    console.log(`[seed] ${nomor}: ${langkah.length} perpindahan status lewat buku besar.`);
  }
}

async function ringkasan() {
  const tabel = ['wilayah', 'users', 'kategori_artikel', 'artikel', 'tag', 'artikel_tag', 'pengaduan', 'pengaduan_riwayat', 'pengurus', 'program', 'galeri', 'pengaturan'];
  const hasil = [];
  for (const t of tabel) hasil.push(`${t}=${await hitungBaris(t)}`);
  console.log('[seed] jumlah baris: ' + hasil.join(' '));
}

try {
  await pastikanSkemaAda();
  const adminId = await seedSuperadmin();
  await jalankanSeedSql();
  await aktifkanStafContoh();
  await transisiPengaduanContoh(adminId);
  await ringkasan();
  console.log('[seed] selesai. CATATAN: artikel/pengaduan/program/galeri/pengurus adalah KONTEN CONTOH — tinjau sebelum publik.');
} catch (galat) {
  console.error('[seed] GAGAL:', galat.message);
  process.exitCode = 1;
} finally {
  await tutupPool();
}
