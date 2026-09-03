// lib/utils.js — pembantu umum (waktu WIB, dsb.)
//
// Aturan 1 (REFERENSI 14): kolom waktu penting diisi dari aplikasi dalam WIB,
// bukan NOW()/CURRENT_TIMESTAMP basis data. Jangan percaya zona waktu mesin:
// semua perhitungan berangkat dari UTC + 7 jam, bukan dari Date lokal.

const SELISIH_WIB_MS = 7 * 60 * 60 * 1000;

/** Date yang komponen UTC-nya menunjukkan angka jam WIB (untuk diformat manual). */
function geserKeWIB(tanggal = new Date()) {
  return new Date(tanggal.getTime() + SELISIH_WIB_MS);
}

function duaDigit(n) {
  return String(n).padStart(2, '0');
}

/** Waktu sekarang dalam WIB, format `YYYY-MM-DD HH:mm:ss` — dipakai seluruh modul lib/db. */
export function waktuSekarang(tanggal = new Date()) {
  const w = geserKeWIB(tanggal);
  return (
    `${w.getUTCFullYear()}-${duaDigit(w.getUTCMonth() + 1)}-${duaDigit(w.getUTCDate())} ` +
    `${duaDigit(w.getUTCHours())}:${duaDigit(w.getUTCMinutes())}:${duaDigit(w.getUTCSeconds())}`
  );
}

/** Waktu dalam format ISO 8601 beroffset WIB, mis. `2026-08-31T14:30:00+07:00`. */
export function waktuISOWIB(tanggal = new Date()) {
  return waktuSekarang(tanggal).replace(' ', 'T') + '+07:00';
}
