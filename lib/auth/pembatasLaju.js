// lib/auth/pembatasLaju.js — pembatas laju login pada dua sumbu (KEPUTUSAN BARU Tahap 2).
//
// Sumbu 1, per IP  : maksimum GAGAL_IP_MAKS kegagalan per JENDELA_MS -> 429 untuk IP itu.
//                    Menangkap satu penyerang yang mencoba banyak akun.
// Sumbu 2, per akun: maksimum GAGAL_AKUN_MAKS kegagalan per JENDELA_MS dari IP MANA PUN
//                    -> 429 untuk akun itu selama sisa jendela (bukan kunci permanen).
//                    Ambangnya sengaja lebih tinggi dan jendelanya pendek, sehingga
//                    pemilik sah paling lama terganggu JENDELA_MS saat akunnya diserang,
//                    dan login yang BERHASIL menghapus hitungan akun itu.
// Tidak ada kunci permanen di basis data: akun tidak bisa "dikunci" oleh orang lain.
//
// Penyimpanan di memori proses (satu container aplikasi — cetak biru). Bila kelak
// ada beberapa replika, pindahkan ke penyimpanan bersama lewat modul ini saja.

const JENDELA_MS = 15 * 60 * 1000;   // 15 menit
const GAGAL_IP_MAKS = 20;             // per IP per jendela
const GAGAL_AKUN_MAKS = 30;           // per akun per jendela (dari semua IP)
const MAKS_ENTRI = 10_000;            // batas memori: entri terlama dibuang

const perIp = new Map();     // ip -> {jumlah, mulai}
const perAkun = new Map();   // email -> {jumlah, mulai}

function bersihkan(peta) {
  const kini = Date.now();
  for (const [k, v] of peta) if (kini - v.mulai > JENDELA_MS) peta.delete(k);
  if (peta.size > MAKS_ENTRI) {
    const kelebihan = peta.size - MAKS_ENTRI;
    let i = 0;
    for (const k of peta.keys()) { if (i++ >= kelebihan) break; peta.delete(k); }
  }
}

function hitung(peta, kunci) {
  const kini = Date.now();
  const v = peta.get(kunci);
  if (!v || kini - v.mulai > JENDELA_MS) return { jumlah: 0, sisaDetik: 0 };
  return { jumlah: v.jumlah, sisaDetik: Math.ceil((v.mulai + JENDELA_MS - kini) / 1000) };
}

/**
 * Periksa SEBELUM memverifikasi kata sandi.
 * @returns {{dibatasi:boolean, alasan?:'ip'|'akun', sisaDetik?:number}}
 */
export function periksaBatasLogin(ip, email) {
  const i = hitung(perIp, ip);
  if (i.jumlah >= GAGAL_IP_MAKS) return { dibatasi: true, alasan: 'ip', sisaDetik: i.sisaDetik };
  const a = hitung(perAkun, String(email).toLowerCase());
  if (a.jumlah >= GAGAL_AKUN_MAKS) return { dibatasi: true, alasan: 'akun', sisaDetik: a.sisaDetik };
  return { dibatasi: false };
}

function tambah(peta, kunci) {
  const kini = Date.now();
  const v = peta.get(kunci);
  if (!v || kini - v.mulai > JENDELA_MS) peta.set(kunci, { jumlah: 1, mulai: kini });
  else v.jumlah += 1;
  if (peta.size % 500 === 0) bersihkan(peta);
}

/** Catat satu kegagalan login (kata sandi salah / email tidak ada / akun nonaktif). */
export function catatGagalLogin(ip, email) {
  tambah(perIp, ip);
  tambah(perAkun, String(email).toLowerCase());
}

/** Login berhasil: hitungan akun dihapus (pemilik sah masuk); hitungan IP tetap. */
export function catatBerhasilLogin(email) {
  perAkun.delete(String(email).toLowerCase());
}
