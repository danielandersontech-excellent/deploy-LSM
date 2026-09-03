// lib/validasi/pengaturan.js — validasi TIPE per kunci pengaturan (Tahap 7, aturan 8).
// Sumber tunggal = lib/pengaturanDefinisi.js: daftar putih kunci DAN tipe datang dari satu tempat,
// sehingga menambah setelan = satu entri di PENGATURAN_DEFINISI (tampilan, daftar putih, validasi ikut).
// Kunci di luar daftar putih DITOLAK dengan pesan jelas (bukan diabaikan diam-diam).
import { definisiPengaturan, KUNCI_PENGATURAN } from '../pengaturanDefinisi.js';

export class GalatValidasiPengaturan extends Error {
  constructor(pesan, kode = 'VALIDASI', kunci = null) { super(pesan); this.kode = kode; this.kunci = kunci; this.status = 422; }
}

const BATAS_TEKS = 255;
const BATAS_TEKS_PANJANG = 20000;

/** Memvalidasi satu nilai menurut tipe definisinya; mengembalikan nilai ternormalisasi (string). */
function validasiNilaiPengaturan(kunci, nilai) {
  const def = definisiPengaturan(kunci);
  if (!def) {
    throw new GalatValidasiPengaturan(`Kunci pengaturan '${kunci}' tidak dikenal. Kunci yang diizinkan: ${KUNCI_PENGATURAN.join(', ')}`, 'KUNCI_TIDAK_SAH', kunci);
  }
  const s = nilai == null ? '' : String(nilai);
  switch (def.tipe) {
    case 'angka': {
      const t = s.trim();
      if (!/^\d{1,12}$/.test(t)) throw new GalatValidasiPengaturan(`'${def.label}' harus bilangan bulat (diberi: '${t.slice(0, 30)}')`, 'TIPE_ANGKA', kunci);
      return String(Number(t));
    }
    case 'teks': {
      const t = s.replace(/\s+/g, ' ').trim();
      if (!t) throw new GalatValidasiPengaturan(`'${def.label}' tidak boleh kosong`, 'WAJIB', kunci);
      if (t.length > BATAS_TEKS) throw new GalatValidasiPengaturan(`'${def.label}' maksimal ${BATAS_TEKS} karakter`, 'TERLALU_PANJANG', kunci);
      if (kunci === 'kontak_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) throw new GalatValidasiPengaturan(`'${def.label}' harus alamat email yang sah`, 'TIPE_EMAIL', kunci);
      if (/<[a-z/!][^>]*>/i.test(t)) throw new GalatValidasiPengaturan(`'${def.label}' tidak boleh memuat tag HTML`, 'HTML_DILARANG', kunci);
      return t;
    }
    case 'teks_panjang': {
      const t = s.replace(/\r\n/g, '\n').trim();
      if (!t) throw new GalatValidasiPengaturan(`'${def.label}' tidak boleh kosong`, 'WAJIB', kunci);
      if (t.length > BATAS_TEKS_PANJANG) throw new GalatValidasiPengaturan(`'${def.label}' maksimal ${BATAS_TEKS_PANJANG} karakter`, 'TERLALU_PANJANG', kunci);
      if (/<(script|iframe|object|embed|style)\b/i.test(t)) throw new GalatValidasiPengaturan(`'${def.label}' tidak boleh memuat skrip`, 'HTML_DILARANG', kunci);
      return t;
    }
    default:
      throw new GalatValidasiPengaturan(`Tipe '${def.tipe}' untuk '${kunci}' belum didukung`, 'TIPE_TIDAK_DIKENAL', kunci);
  }
}

/** Memvalidasi objek {kunci: nilai}; SEMUA kunci diperiksa dulu — satu kunci salah = seluruh kiriman ditolak. */
export function validasiPasanganPengaturan(pasangan) {
  if (!pasangan || typeof pasangan !== 'object' || Array.isArray(pasangan)) throw new GalatValidasiPengaturan('Muatan harus objek {kunci: nilai}', 'MUATAN_TIDAK_SAH');
  const kunciDikirim = Object.keys(pasangan);
  if (kunciDikirim.length === 0) throw new GalatValidasiPengaturan('Tidak ada setelan yang dikirim', 'KOSONG');
  const hasil = {};
  for (const k of kunciDikirim) hasil[k] = validasiNilaiPengaturan(k, pasangan[k]);
  return hasil;
}
