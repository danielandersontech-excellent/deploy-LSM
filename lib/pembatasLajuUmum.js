// lib/pembatasLajuUmum.js — pembatas laju umum per IP untuk route publik (TAHAP-06 §11).
// Penyimpanan di memori proses (satu container, cetak biru); pola sama dengan lib/auth/pembatasLaju.js.
//
// KEPUTUSAN BARU — penyeimbangan untuk pelapor sah dari IP bersama (warnet, kantor desa):
//   * Ambang per IP sengaja LONGGAR untuk manusia tetapi cukup untuk menahan skrip:
//       pengaduan : 10 kiriman / 60 menit per IP (satu kantor desa yang mengirim 10 laporan
//                   dalam sejam masih sangat jarang; skrip massal terhenti di kiriman ke-11),
//       lacak     : 60 permintaan / 15 menit per IP (penjelajahan massal nomor WRP-xxxxxx
//                   — 1.000.000 kemungkinan — menjadi tidak praktis: ≥ 4.000 jam per IP).
//   * Bukan CAPTCHA pihak ketiga (melacak pengguna; bertentangan dengan janji kerahasiaan);
//     tantangan sederhana = honeypot + token formulir bertanda waktu (lib/tokenFormulir.js).
//   * Pesan 429 netral dan tidak menyalahkan pelapor, menyebut sisa waktu tunggu.
//   * Pembatasan hanya pada IP; tidak ada yang disimpan tentang pelapor.

const KONFIG = Object.freeze({
  pengaduan: { maks: 10, jendelaMs: 60 * 60 * 1000 },
  lacak: { maks: 60, jendelaMs: 15 * 60 * 1000 },
  unggah_publik: { maks: 40, jendelaMs: 60 * 60 * 1000 },
});
const MAKS_ENTRI = 20_000;
const peta = new Map(); // `${namespace}|${ip}` -> {jumlah, mulai}

function bersihkan() {
  const kini = Date.now();
  for (const [k, v] of peta) if (kini - v.mulai > v.jendelaMs) peta.delete(k);
  if (peta.size > MAKS_ENTRI) {
    const kelebihan = peta.size - MAKS_ENTRI;
    let i = 0;
    for (const k of peta.keys()) { if (i++ >= kelebihan) break; peta.delete(k); }
  }
}

/**
 * Memeriksa DAN mencatat satu permintaan. Mengembalikan {dibatasi, sisaDetik, sisaKuota}.
 * @param {'pengaduan'|'lacak'|'unggah_publik'} namespace
 */
export function periksaLaju(namespace, ip) {
  const k = KONFIG[namespace];
  if (!k) throw new Error(`Namespace pembatas tidak dikenal: ${namespace}`);
  const kunci = `${namespace}|${ip || '0.0.0.0'}`;
  const kini = Date.now();
  let v = peta.get(kunci);
  if (!v || kini - v.mulai > k.jendelaMs) {
    v = { jumlah: 0, mulai: kini, jendelaMs: k.jendelaMs };
    peta.set(kunci, v);
  }
  if (v.jumlah >= k.maks) {
    return { dibatasi: true, sisaDetik: Math.ceil((v.mulai + k.jendelaMs - kini) / 1000), sisaKuota: 0 };
  }
  v.jumlah += 1;
  if (peta.size % 500 === 0) bersihkan();
  return { dibatasi: false, sisaDetik: 0, sisaKuota: k.maks - v.jumlah };
}

/** Pesan 429 yang netral (tidak menyalahkan pelapor). */
export function pesanDibatasi(sisaDetik) {
  const menit = Math.max(1, Math.ceil(sisaDetik / 60));
  return `Terlalu banyak permintaan dari jaringan Anda dalam waktu singkat. Ini pengaman otomatis, bukan penolakan laporan Anda — silakan coba lagi dalam sekitar ${menit} menit, atau hubungi hotline kami.`;
}

/** Untuk uji. */
export function setelUlangPembatasUmum() {
  peta.clear();
}

export const KONFIG_PEMBATAS_UMUM = KONFIG;
