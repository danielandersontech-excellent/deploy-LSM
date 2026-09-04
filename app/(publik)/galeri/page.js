// app/(publik)/galeri/page.js — GALERI DOKUMENTASI. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari galeri_dokumentasi/code.html (screen.png 1280 px).
// Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) gambar googleusercontent -> jalur
// berkas dari DB (div background-image + role="img"), (c) href -> rute, (d) bagian DINAMIS
// (kartu galeri, opsi kategori) -> DB / lib/kategoriGaleri, (e) kartu berulang -> .map() per SLOT
// (slot 1 = kartu besar, slot 2.. = kartu kecil; kartu di luar 6 slot memakai kelas slot terakhir),
// (f) JSX. Navbar/footer dari layout (18.3).
// Filter = <form method="get"> (bekerja tanpa JavaScript): ?kategori= ?dari= ?sampai= ?halaman=.
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KirimOtomatis from '@/components/publik/KirimOtomatis';
import Lencana, { varianLencanaGaleri } from '@/components/ui/Lencana';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilGaleri } from '@/lib/db/galeri';
import { KATEGORI_GALERI, SLUG_KATEGORI_GALERI } from '@/lib/kategoriGaleri';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Galeri Dokumentasi',
  description: 'Dokumentasi dan arsip visual kegiatan WARKOP NUSANTARA: investigasi lapangan, sosialisasi, dan audiensi publik dalam mengawal aspirasi rakyat.',
};

// KEPUTUSAN BARU: 6 kartu per halaman = jumlah slot grid di desain (1 besar + 5 kecil).
const PER_HALAMAN = 6;

/** Tanggal YYYY-MM-DD yang valid; selain itu diabaikan (tidak ikut ke SQL). */
function tanggalValid(nilai) {
  if (typeof nilai !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return null;
  const d = new Date(`${nilai}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== nilai ? null : nilai;
}

function kategoriDari(slug) {
  return KATEGORI_GALERI.find((k) => k.slug === slug) ?? { slug, label: slug, lencana: 'abu' };
}

/** Gambar kartu: thumbnail bila ada, lalu berkas foto; video tanpa thumbnail memakai segel logo. */
function gambarKartu(item) {
  if (item.thumbnail) return item.thumbnail;
  if (item.jenis === 'video') return '/logo-warkop-besar.png';
  return item.berkas;
}

export default async function HalamanGaleri({ searchParams }) {
  const sp = await searchParams;
  const kategori = SLUG_KATEGORI_GALERI.includes(sp?.kategori) ? sp.kategori : null;
  const dari = tanggalValid(sp?.dari);
  const sampai = tanggalValid(sp?.sampai);
  const halamanDiminta = Math.max(1, parseInt(sp?.halaman, 10) || 1);

  const { baris, halaman, totalHalaman } = await ambilGaleri({ kategori, dari, sampai, halaman: halamanDiminta, perHalaman: PER_HALAMAN });
  const adaFilter = Boolean(kategori || dari || sampai);

  /** Tautan yang mempertahankan filter aktif (dipakai tombol "Muat Lebih Banyak"). */
  function buatHref(perubahan = {}) {
    const q = new URLSearchParams();
    if (kategori) q.set('kategori', kategori);
    if (dari) q.set('dari', dari);
    if (sampai) q.set('sampai', sampai);
    for (const [kunci, nilai] of Object.entries(perubahan)) {
      if (nilai === null || nilai === undefined || nilai === '') q.delete(kunci);
      else q.set(kunci, String(nilai));
    }
    const s = q.toString();
    return s ? `/galeri?${s}` : '/galeri';
  }

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Header Section */}
      <header className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="font-headline-xl text-headline-xl md:text-headline-xl text-primary mb-4">Dokumentasi &amp; Arsip Visual</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Rekam jejak kegiatan Warkop Nusantara dalam mengawal aspirasi rakyat dan melakukan investigasi lapangan.
        </p>
      </header>
      {/* Filters — KEPUTUSAN BARU: div pembungkus menjadi <form method="get"> dengan kelas yang sama */}
      <section className="bg-surface-container-low border border-outline-variant rounded-lg p-6 mb-12 pressed-paper-shadow">
        <form method="get" action="/galeri" className="flex flex-col md:flex-row gap-6 items-end">
          {/* QA-2 B6: filter diterapkan lewat navigasi klien (posisi gulir tetap); tombol Terapkan Filter tetap (desain) */}
          <KirimOtomatis />
          <div className="w-full md:w-1/3">
            <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="category">Kategori Kegiatan</label>
            <div className="relative">
              <select className="w-full bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 appearance-none font-body-md text-body-md" id="category" name="kategori" defaultValue={kategori ?? ''}>
                <option value="">Semua Kategori</option>
                {KATEGORI_GALERI.map((k) => (
                  <option key={k.slug} value={k.slug}>{k.label}</option>
                ))}
              </select>
              <Ikon nama="arrow_drop_down" className="absolute right-3 top-2.5 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="date-range">Rentang Tanggal</label>
            {/* KEPUTUSAN BARU: desain menggambar SATU kotak teks untuk rentang; dibutuhkan dua nilai (dari/sampai)
                -> dua <input type="date"> berkelas verbatim berdampingan di dalam div .relative yang sama. */}
            <div className="relative flex items-center gap-2">
              <input className="w-full min-w-0 flex-1 bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 font-body-md text-body-md" id="date-range" name="dari" placeholder="Pilih Tanggal..." type="date" defaultValue={dari ?? ''} />
              <label className="sr-only" htmlFor="date-range-sampai">Tanggal akhir</label>
              <input className="w-full min-w-0 flex-1 bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 font-body-md text-body-md [&::-webkit-calendar-picker-indicator]:opacity-0" id="date-range-sampai" name="sampai" type="date" defaultValue={sampai ?? ''} />
              <Ikon nama="calendar_today" className="absolute right-3 top-2.5 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <button type="submit" className="w-full bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded hover:bg-primary-container transition-colors flex items-center justify-center gap-2 pressed-paper-shadow">
              <Ikon nama="filter_list" className="text-sm" />
              Terapkan Filter
            </button>
          </div>
        </form>
      </section>
      {/* Gallery Bento Grid */}
      {baris.length === 0 ? (
        <KeadaanKosong
          ikon="image"
          judul={halamanDiminta > 1 ? 'Halaman tidak berisi dokumentasi' : 'Belum ada dokumentasi'}
          keterangan={
            halamanDiminta > 1
              ? `Galeri ini hanya memiliki ${totalHalaman} halaman.`
              : adaFilter
                ? 'Tidak ada dokumentasi yang cocok dengan filter yang dipilih.'
                : 'Dokumentasi kegiatan akan tampil di sini setelah diunggah.'
          }
        >
          {halamanDiminta > 1
            ? <Link scroll={false} href={buatHref()} className="font-label-md text-label-md text-secondary hover:underline">Kembali ke halaman pertama</Link>
            : adaFilter
              ? <Link href="/galeri" className="font-label-md text-label-md text-secondary hover:underline">Tampilkan semua dokumentasi</Link>
              : null}
        </KeadaanKosong>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-unit auto-rows-[250px]">
          {baris.map((item, indeks) => {
            const kat = kategoriDari(item.kategori);
            const video = item.jenis === 'video';
            const lokasi = item.lokasi || item.wilayah_nama || null;
            const tanggal = formatTanggalID(item.tanggal_kegiatan);
            const labelGambar = `${item.judul} (${kat.label})`;
            // Overlay & tombol putar mengikuti kartu video desain (Item 3); kartu foto memakai gradien.
            const kelasVideo = video ? ' flex items-center justify-center' : '';
            const tombolPutar = video ? (
              /* Play Button Overlay for Video — KEPUTUSAN BARU: lingkaran menjadi tautan ke berkas video (pointer-events-auto) */
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <a href={item.berkas} aria-label={`Putar video: ${item.judul}`} className="w-16 h-16 rounded-full bg-secondary-fixed/90 flex items-center justify-center shadow-lg border-2 border-secondary pointer-events-auto">
                  <Ikon nama="play_arrow" className="text-on-secondary-fixed-variant text-3xl" />
                </a>
              </div>
            ) : null;

            if (indeks === 0) {
              /* Item 1 (Large) */
              return (
                <article key={item.id} className={`md:col-span-8 md:row-span-2 relative group overflow-hidden rounded-lg border border-tertiary-fixed-dim bg-surface${kelasVideo}`}>
                  <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105${video ? ' opacity-60' : ''}`} role="img" aria-label={labelGambar} style={{ backgroundImage: `url('${gambarKartu(item)}')` }}></div>
                  {video
                    ? <div className="absolute inset-0 bg-primary/70 group-hover:bg-primary/60 transition-colors"></div>
                    : <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>}
                  {tombolPutar}
                  <div className={`absolute bottom-0 left-0 p-6 w-full${video ? ' z-10' : ''}`}>
                    <Lencana varian={varianLencanaGaleri(kat.lencana)}>{kat.label}</Lencana>
                    <h2 className="font-headline-lg text-headline-lg md:text-headline-lg text-on-primary mb-2">{item.judul}</h2>
                    {item.deskripsi ? <p className="font-body-md text-body-md text-outline-variant line-clamp-2">{item.deskripsi}</p> : null}
                    <div className="flex items-center gap-4 mt-4 text-outline-variant text-sm font-label-md">
                      <span className="flex items-center gap-1"><Ikon nama="event" className="text-[16px]" /> {tanggal}</span>
                      {lokasi ? <span className="flex items-center gap-1"><Ikon nama="location_on" className="text-[16px]" /> {lokasi}</span> : null}
                    </div>
                  </div>
                </article>
              );
            }
            /* Item 2 .. n (kelas kartu kecil pertama, Item 2) */
            return (
              <article key={item.id} className={`md:col-span-4 md:row-span-1 relative group overflow-hidden rounded-lg border border-tertiary-fixed-dim bg-surface${kelasVideo}`}>
                <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105${video ? ' opacity-60' : ''}`} role="img" aria-label={labelGambar} style={{ backgroundImage: `url('${gambarKartu(item)}')` }}></div>
                {video
                  ? <div className="absolute inset-0 bg-primary/70 group-hover:bg-primary/60 transition-colors"></div>
                  : <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>}
                {tombolPutar}
                <div className={`absolute bottom-0 left-0 p-4 w-full${video ? ' z-10' : ''}`}>
                  <Lencana varian={varianLencanaGaleri(kat.lencana)}>{kat.label}</Lencana>
                  <h3 className="font-headline-md text-[18px] leading-tight text-on-primary mb-1">{item.judul}</h3>
                  <div className="flex items-center gap-2 mt-2 text-outline-variant text-xs font-label-md">
                    <span className="flex items-center gap-1"><Ikon nama="event" className="text-[14px]" /> {tanggal}</span>
                    {lokasi ? <span className="flex items-center gap-1"><Ikon nama="location_on" className="text-[14px]" /> {lokasi}</span> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      {/* Load More — tautan ?halaman=N+1 yang mempertahankan filter; disembunyikan di halaman terakhir */}
      {halaman < totalHalaman ? (
        <div className="mt-12 flex justify-center">
          <Link scroll={false} href={buatHref({ halaman: halaman + 1 })} className="bg-surface border-2 border-outline hover:border-primary text-on-surface font-label-md text-label-md px-8 py-3 rounded-lg transition-colors flex items-center gap-2">
            Muat Lebih Banyak
            <Ikon nama="expand_more" className="text-sm" />
          </Link>
        </div>
      ) : null}
    </main>
  );
}
