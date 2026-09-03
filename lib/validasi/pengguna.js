// lib/validasi/pengguna.js — validasi DI SERVER untuk kelola pengguna (Tahap 7, superadmin saja).
import { peranValid } from '../auth/hakAkses.js';

export class GalatValidasiPengguna extends Error {
  constructor(pesan, kode = 'VALIDASI', bidang = null) { super(pesan); this.kode = kode; this.bidang = bidang; this.status = 422; }
}

export const SANDI_MIN = 10;

const teks = (v, maks) => (v == null ? '' : String(v).trim().slice(0, maks));
const benar = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'on';

export function validasiKataSandi(sandi, bidang = 'kata_sandi') {
  const s = String(sandi ?? '');
  if (s.length < SANDI_MIN) throw new GalatValidasiPengguna(`Kata sandi minimal ${SANDI_MIN} karakter`, 'SANDI_LEMAH', bidang);
  if (s.length > 200) throw new GalatValidasiPengguna('Kata sandi terlalu panjang', 'SANDI_TERLALU_PANJANG', bidang);
  if (!/[a-zA-Z]/.test(s) || !/[0-9]/.test(s)) throw new GalatValidasiPengguna('Kata sandi harus memuat huruf dan angka', 'SANDI_LEMAH', bidang);
  return s;
}

/** Muatan buat/ubah pengguna: nama, email, peran, wilayah_id, aktif (+ kata_sandi saat buat). */
export function validasiPengguna(body, { baru = false } = {}) {
  if (!body || typeof body !== 'object') throw new GalatValidasiPengguna('Muatan harus JSON', 'MUATAN_TIDAK_SAH');
  const nama = teks(body.nama, 100);
  if (nama.length < 3) throw new GalatValidasiPengguna('Nama wajib diisi (minimal 3 karakter)', 'NAMA_WAJIB', 'nama');
  const email = teks(body.email, 190).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new GalatValidasiPengguna('Alamat email tidak sah', 'EMAIL_TIDAK_SAH', 'email');
  const peran = teks(body.peran, 30);
  if (!peranValid(peran)) throw new GalatValidasiPengguna('Peran tidak dikenal', 'PERAN_TIDAK_SAH', 'peran');
  let wilayahId = null;
  const w = body.wilayah_id ?? body.wilayahId;
  if (w !== null && w !== undefined && w !== '') {
    wilayahId = Number(w);
    if (!Number.isInteger(wilayahId) || wilayahId <= 0) throw new GalatValidasiPengguna('Wilayah tidak sah', 'WILAYAH_TIDAK_SAH', 'wilayah_id');
  }
  if (peran === 'pimpinan_wilayah' && !wilayahId) throw new GalatValidasiPengguna('Pimpinan wilayah wajib memiliki wilayah', 'WILAYAH_WAJIB', 'wilayah_id');
  const aktif = body.aktif === undefined ? 1 : (benar(body.aktif) ? 1 : 0);
  const hasil = { nama, email, peran, wilayahId: peran === 'pimpinan_wilayah' ? wilayahId : wilayahId, aktif };
  if (baru) hasil.kataSandi = validasiKataSandi(body.kata_sandi ?? body.kataSandi);
  return hasil;
}
