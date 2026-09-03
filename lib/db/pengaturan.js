// lib/db/pengaturan.js — tabel kunci-nilai. Daftar putih kunci = lib/pengaturanDefinisi.js.
import { kueri } from './index.js';
import { waktuSekarang } from '../utils.js';
import { KUNCI_PENGATURAN, kunciPengaturanValid, pengaturanBawaan } from '../pengaturanDefinisi.js';

/**
 * Mengambil setelan sebagai objek {kunci: nilai}. Kunci yang belum ada di DB
 * diisi nilai bawaan dari definisi, sehingga tampilan tidak pernah kosong.
 * @param {string[]} [kunci] subset kunci; bawaan = seluruh daftar putih
 */
export async function ambilPengaturan(kunci = KUNCI_PENGATURAN) {
  const daftar = kunci.filter(kunciPengaturanValid);
  const hasil = { ...pengaturanBawaan() };
  if (daftar.length === 0) return {};
  const placeholder = daftar.map(() => '?').join(', ');
  const baris = await kueri(`SELECT kunci, nilai FROM pengaturan WHERE kunci IN (${placeholder})`, daftar);
  for (const b of baris) hasil[b.kunci] = b.nilai;
  return Object.fromEntries(daftar.map((k) => [k, hasil[k]]));
}

/**
 * Menyimpan beberapa setelan sekaligus. Kunci di luar daftar putih DITOLAK
 * dengan galat (bukan diabaikan diam-diam — pelajaran Cap Jiki nomor 8).
 * Mengembalikan daftar kunci yang tersimpan.
 */
export async function simpanPengaturan(pasangan, koneksi = null) {
  const kunciTidakSah = Object.keys(pasangan).filter((k) => !kunciPengaturanValid(k));
  if (kunciTidakSah.length) {
    const galat = new Error(`Kunci pengaturan tidak dikenal: ${kunciTidakSah.join(', ')}`);
    galat.kode = 'KUNCI_TIDAK_SAH';
    throw galat;
  }
  const sekarang = waktuSekarang();
  const tersimpan = [];
  for (const [kunci, nilai] of Object.entries(pasangan)) {
    await kueri(
      `INSERT INTO pengaturan (kunci, nilai, diperbarui_pada) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), diperbarui_pada = VALUES(diperbarui_pada)`,
      [kunci, nilai == null ? null : String(nilai), sekarang],
      koneksi,
    );
    tersimpan.push(kunci);
  }
  return tersimpan;
}
