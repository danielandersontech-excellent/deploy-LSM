// components/ui/Paginasi.js — paginasi publik. Kelas VERBATIM dari
// daftar_berita_investigasi/code.html (baris 329–341): tombol panah kotak, halaman aktif
// bergaris bawah emas, elipsis "...". Tombol desain -> <Link> ke ?halaman=N (perubahan 18.2c);
// halaman pertama/terakhir tanpa panah aktif dirender sebagai <span> ber-disabled (bukan tautan).
//   <Paginasi halaman={2} totalHalaman={8} buatHref={(n) => `/berita?halaman=${n}`} />
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';

const KELAS_PANAH = 'w-10 h-10 flex items-center justify-center border border-outline-variant rounded text-on-surface hover:bg-surface-container-high transition-colors';
const KELAS_PANAH_MATI = 'w-10 h-10 flex items-center justify-center border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 opacity-50';
const KELAS_AKTIF = 'w-10 h-10 flex items-center justify-center border-b-2 border-secondary-fixed-dim bg-surface-container-lowest text-primary font-bold transition-colors';
const KELAS_NOMOR = 'w-10 h-10 flex items-center justify-center border border-transparent rounded text-on-surface hover:bg-surface-container-high transition-colors';

/** Nomor halaman yang ditampilkan: 1, tetangga halaman aktif, dan terakhir; null = elipsis. */
function daftarNomor(halaman, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, 3, total, halaman - 1, halaman, halaman + 1].filter((n) => n >= 1 && n <= total));
  const urut = [...set].sort((a, b) => a - b);
  const hasil = [];
  for (let i = 0; i < urut.length; i++) {
    if (i > 0 && urut[i] - urut[i - 1] > 1) hasil.push(null);
    hasil.push(urut[i]);
  }
  return hasil;
}

export default function Paginasi({ halaman, totalHalaman, buatHref, className = '' }) {
  if (!totalHalaman || totalHalaman <= 1) return null;
  const hal = Math.min(Math.max(1, Number(halaman) || 1), totalHalaman);
  return (
    <nav className={`mt-16 flex justify-center items-center gap-2${className ? ` ${className}` : ''}`} aria-label="Paginasi">
      {hal > 1 ? (
        <Link className={KELAS_PANAH} href={buatHref(hal - 1)} aria-label="Halaman sebelumnya"><Ikon nama="chevron_left" /></Link>
      ) : (
        <span className={KELAS_PANAH_MATI} aria-disabled="true"><Ikon nama="chevron_left" /></span>
      )}
      {daftarNomor(hal, totalHalaman).map((n, i) =>
        n === null ? (
          <span key={`elipsis-${i}`} className="text-outline mx-1">...</span>
        ) : n === hal ? (
          <span key={n} className={KELAS_AKTIF} aria-current="page">{n}</span>
        ) : (
          <Link key={n} className={KELAS_NOMOR} href={buatHref(n)} aria-label={`Halaman ${n}`}>{n}</Link>
        ),
      )}
      {hal < totalHalaman ? (
        <Link className={KELAS_PANAH} href={buatHref(hal + 1)} aria-label="Halaman berikutnya"><Ikon nama="chevron_right" /></Link>
      ) : (
        <span className={KELAS_PANAH_MATI} aria-disabled="true"><Ikon nama="chevron_right" /></span>
      )}
    </nav>
  );
}
