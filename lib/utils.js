// lib/utils.js — pembantu umum (waktu WIB, slug, format tanggal Indonesia).
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

/** Tanggal hari ini dalam WIB, format `YYYY-MM-DD`. */
export function tanggalSekarang(tanggal = new Date()) {
  return waktuSekarang(tanggal).slice(0, 10);
}

/** Waktu dalam format ISO 8601 beroffset WIB, mis. `2026-08-31T14:30:00+07:00`. */
export function waktuISOWIB(tanggal = new Date()) {
  return waktuSekarang(tanggal).replace(' ', 'T') + '+07:00';
}

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/**
 * Format tanggal Indonesia dalam WIB. Menerima Date (dari mysql2, sudah benar
 * karena pool memakai timezone +07:00) atau string `YYYY-MM-DD[ HH:mm:ss]`.
 * gaya: 'singkat' -> "12 Okt 2024" ; 'panjang' -> "24 Oktober 2024" ;
 *       'lengkap' -> "12 Okt 2024, 14:30 WIB"
 */
export function formatTanggalID(nilai, gaya = 'singkat') {
  if (!nilai) return '';
  let d;
  if (nilai instanceof Date) d = geserKeWIB(nilai);
  else {
    const m = String(nilai).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return String(nilai);
    d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)));
  }
  const hari = d.getUTCDate(), bulan = d.getUTCMonth(), tahun = d.getUTCFullYear();
  if (gaya === 'panjang') return `${hari} ${BULAN_PANJANG[bulan]} ${tahun}`;
  if (gaya === 'lengkap') return `${hari} ${BULAN_SINGKAT[bulan]} ${tahun}, ${duaDigit(d.getUTCHours())}:${duaDigit(d.getUTCMinutes())} WIB`;
  return `${duaDigit(hari)} ${BULAN_SINGKAT[bulan]} ${tahun}`;
}

/** Slug URL dari judul: huruf kecil, ASCII, tanda hubung. */
export function buatSlug(teks, maks = 120) {
  return String(teks)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maks)
    .replace(/-+$/g, '');
}

/** Format angka gaya Indonesia: 12000 -> "12.000". */
export function formatAngkaID(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}
