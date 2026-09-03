// lib/validasi/pengaduan.js — validasi kiriman pengaduan DI SERVER (TAHAP-06 §2, aturan 13).
// PRINSIP INTI: bila anonim === true, keempat kolom identitas DIABAIKAN apa pun yang ikut
// terkirim dan disimpan NULL (lapisan kedua setelah formulir yang tidak mengirimnya).
import { kategoriPengaduanValid } from '../kategoriPengaduan.js';

/** Pesan NETRAL pelacakan: sama untuk nomor tidak ada, format salah, maupun kasus yang tidak boleh dilihat. */
export const PESAN_TIDAK_DITEMUKAN = 'Nomor kasus tidak dikenali. Periksa kembali penulisannya (format WRP-XXXXXX).';

/** Catatan internal wajib saat mengubah status (TAHAP-06 §7) — minimal 10 karakter bermakna. */
export const CATATAN_MIN = 10;

export const BATAS = Object.freeze({ nama: 150, nik: 16, telepon: 30, email: 190, lokasi: 200, deskripsiMin: 30, deskripsiMaks: 10_000 });

export class GalatValidasiPengaduan extends Error {
  constructor(pesan, kode = 'VALIDASI', bidang = null) { super(pesan); this.kode = kode; this.bidang = bidang; this.status = 422; }
}

function teks(nilai, maks) {
  if (nilai == null) return '';
  return String(nilai).replace(/\s+/g, ' ').trim().slice(0, maks);
}

function benar(nilai) {
  return nilai === true || nilai === 1 || nilai === '1' || nilai === 'true' || nilai === 'on' || nilai === 'ya';
}

/**
 * @param {Record<string, any>} data — dari JSON atau FormData (nilai string)
 * @returns {{anonim:boolean, namaPelapor, nikPelapor, teleponPelapor, emailPelapor, kategoriMasalah, wilayahId, lokasiKejadian, deskripsi}}
 */
export function validasiKirimanPengaduan(data) {
  if (!data || typeof data !== 'object') throw new GalatValidasiPengaduan('Muatan tidak sah', 'MUATAN_TIDAK_SAH');
  const anonim = benar(data.anonim);

  const kategori = teks(data.kategori_masalah ?? data.kategoriMasalah ?? data.kategori, 50);
  if (!kategoriPengaduanValid(kategori)) throw new GalatValidasiPengaduan('Kategori masalah wajib dipilih dari daftar', 'KATEGORI_TIDAK_SAH', 'kategori_masalah');

  const wilayahMentah = data.wilayah_id ?? data.wilayahId ?? data.wilayah;
  let wilayahId = null;
  if (wilayahMentah !== null && wilayahMentah !== undefined && String(wilayahMentah) !== '') {
    wilayahId = Number(wilayahMentah);
    if (!Number.isInteger(wilayahId) || wilayahId <= 0) throw new GalatValidasiPengaduan('Wilayah kejadian tidak sah', 'WILAYAH_TIDAK_SAH', 'wilayah_id');
  }

  const deskripsi = String(data.deskripsi ?? '').replace(/\r\n/g, '\n').trim().slice(0, BATAS.deskripsiMaks);
  if (deskripsi.length < BATAS.deskripsiMin) throw new GalatValidasiPengaduan(`Deskripsi kejadian wajib diisi (minimal ${BATAS.deskripsiMin} karakter)`, 'DESKRIPSI_WAJIB', 'deskripsi');

  const lokasiKejadian = teks(data.lokasi_kejadian ?? data.lokasiKejadian, BATAS.lokasi) || null;

  // ---- identitas: hanya diproses bila TIDAK anonim ----
  let namaPelapor = null, nikPelapor = null, teleponPelapor = null, emailPelapor = null;
  if (!anonim) {
    namaPelapor = teks(data.nama_pelapor ?? data.namaPelapor ?? data.nama, BATAS.nama) || null;
    nikPelapor = teks(data.nik_pelapor ?? data.nikPelapor ?? data.nik, BATAS.nik).replace(/\D/g, '') || null;
    teleponPelapor = teks(data.telepon_pelapor ?? data.teleponPelapor ?? data.telepon, BATAS.telepon).replace(/[^\d+\-\s()]/g, '').trim() || null;
    emailPelapor = teks(data.email_pelapor ?? data.emailPelapor ?? data.email, BATAS.email).toLowerCase() || null;
    if (!namaPelapor || namaPelapor.length < 3) throw new GalatValidasiPengaduan('Nama lengkap wajib diisi untuk laporan bernama (atau pilih laporan anonim)', 'NAMA_WAJIB', 'nama_pelapor');
    if (nikPelapor && nikPelapor.length !== 16) throw new GalatValidasiPengaduan('NIK harus 16 digit', 'NIK_TIDAK_SAH', 'nik_pelapor');
    if (emailPelapor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPelapor)) throw new GalatValidasiPengaduan('Alamat email tidak sah', 'EMAIL_TIDAK_SAH', 'email_pelapor');
    if (teleponPelapor && teleponPelapor.replace(/\D/g, '').length < 8) throw new GalatValidasiPengaduan('Nomor telepon tidak sah', 'TELEPON_TIDAK_SAH', 'telepon_pelapor');
    if (!teleponPelapor && !emailPelapor) throw new GalatValidasiPengaduan('Isi nomor telepon atau email agar kami bisa meminta klarifikasi (atau pilih laporan anonim)', 'KONTAK_WAJIB', 'telepon_pelapor');
  }

  return { anonim, namaPelapor, nikPelapor, teleponPelapor, emailPelapor, kategoriMasalah: kategori, wilayahId, lokasiKejadian, deskripsi };
}
