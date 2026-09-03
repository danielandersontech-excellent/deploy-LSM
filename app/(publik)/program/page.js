// app/(publik)/program/page.js — PROGRAM & KEGIATAN. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari program_kegiatan/code.html (screen.png rusak —
// code.html satu-satunya sumber). Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>,
// (b) gambar googleusercontent -> penampung lokal/DB, (c) href/button -> rute sungguhan,
// (d) bagian DINAMIS (kartu program) -> tabel `program`, (e) kartu berulang -> .map(),
// (f) JSX. Navbar/footer dari layout (18.3).
//
// Filter WAJIB tercermin di URL dan bekerja tanpa JavaScript (TAHAP-04 bagian 5, uji f):
//   ?kategori=<slug>  — chip kategori desain (button) -> <Link> yang membawa status/urut aktif
//   ?status=berjalan|selesai, ?urut=terbaru|terlama — <form method="get"> + <select> + tombol kirim
//   ?halaman=N        — paginasi (markup code.html sendiri; berbeda dari daftar_berita_investigasi)
// Nilai tak sah diperlakukan sebagai kosong.
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';
import { ambilProgram } from '@/lib/db/program';
import { KATEGORI_PROGRAM, SLUG_KATEGORI_PROGRAM, STATUS_PROGRAM, labelKategoriProgram } from '@/lib/kategoriProgram';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Program & Kegiatan',
  description: 'Inisiatif pengawasan dana, observasi kebijakan, dan bantuan hukum WARKOP NUSANTARA — yang sedang berjalan maupun yang telah selesai demi kepentingan publik.',
};

// 3 kolom (lg:grid-cols-3) × 3 baris; sama dengan bawaan ambilProgram().
const PER_HALAMAN = 9;
const URUT_SAH = ['terbaru', 'terlama'];
const STATUS_SAH = STATUS_PROGRAM.map((s) => s.slug);

/** Ambil satu nilai string dari searchParams (bisa array bila kunci diulang). */
function satuNilai(v) {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

/** Bangun href /program dengan filter yang dipertahankan; nilai kosong dan halaman 1 tidak ditulis. */
function buatHref({ kategori, status, urut, halaman }) {
  const q = new URLSearchParams();
  if (kategori) q.set('kategori', kategori);
  if (status) q.set('status', status);
  if (urut) q.set('urut', urut);
  if (halaman && halaman > 1) q.set('halaman', String(halaman));
  const s = q.toString();
  return s ? `/program?${s}` : '/program';
}

/** "Okt 2023" dari tanggal; memakai formatTanggalID lalu membuang bagian hari. */
function bulanTahun(nilai) {
  return formatTanggalID(nilai, 'singkat').slice(3);
}

/** Periode program seperti contoh desain: "Okt 2023 - Sekarang", "Jan - Jun 2023". */
function periodeProgram(mulai, selesai) {
  if (!mulai) return selesai ? `Selesai ${bulanTahun(selesai)}` : 'Sekarang';
  const awal = bulanTahun(mulai);
  if (!selesai) return `${awal} - Sekarang`;
  const akhir = bulanTahun(selesai);
  // Tahun sama -> "Jan - Jun 2023"; tahun beda -> "Nov 2022 - Mar 2023".
  return awal.slice(-4) === akhir.slice(-4) ? `${awal.slice(0, 3)} - ${akhir}` : `${awal} - ${akhir}`;
}

function ikonKategoriProgram(slug) {
  return KATEGORI_PROGRAM.find((k) => k.slug === slug)?.ikon ?? 'explore';
}

/** Nomor halaman paginasi: semua bila ≤ 7; selain itu 1, tetangga aktif, terakhir (null = elipsis). */
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

export default async function HalamanProgram({ searchParams }) {
  const sp = await searchParams;
  const kategoriMentah = satuNilai(sp?.kategori);
  const statusMentah = satuNilai(sp?.status);
  const urutMentah = satuNilai(sp?.urut);
  const halamanMentah = Number.parseInt(satuNilai(sp?.halaman), 10);

  const kategori = SLUG_KATEGORI_PROGRAM.includes(kategoriMentah) ? kategoriMentah : '';
  const status = STATUS_SAH.includes(statusMentah) ? statusMentah : '';
  const urut = URUT_SAH.includes(urutMentah) ? urutMentah : '';
  const halamanDiminta = Number.isInteger(halamanMentah) && halamanMentah >= 1 ? halamanMentah : 1;

  const { baris, total, halaman, totalHalaman } = await ambilProgram({
    kategori: kategori || null,
    status: status || null,
    urut: urut || 'terbaru',
    halaman: halamanDiminta,
    perHalaman: PER_HALAMAN,
  });
  const filterAktif = { kategori, status, urut };
  const adaFilter = Boolean(kategori || status);

  return (
    <main id="konten-utama" className="flex-grow">
      {/* Hero Section */}
      <section className="bg-surface-container-low border-b border-tertiary">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-2/3">
            <h1 className="font-headline-lg-mobile md:font-headline-xl text-headline-lg-mobile md:text-headline-xl text-primary mb-4">Program &amp; Kegiatan</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Mewujudkan transparansi dan keadilan melalui tindakan nyata. Berikut adalah inisiatif pengawasan dan observasi yang sedang berjalan maupun yang telah kami selesaikan demi kepentingan publik.</p>
          </div>
          <div className="w-full md:w-1/3 flex justify-end">
            {/* Minimalist illustrative placeholder for theme context — KEPUTUSAN BARU: ilustrasi Stitch tidak ada berkasnya -> segel logo besar lokal */}
            <div className="w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-tertiary relative pressed-paper-shadow">
              <div className="bg-cover bg-center w-full h-full absolute inset-0" role="img" aria-label="Segel WARKOP NUSANTARA — pengawasan dan transparansi" style={{ backgroundImage: "url('/logo-warkop-besar.png')" }}></div>
            </div>
          </div>
        </div>
      </section>
      {/* Main Content Area */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 gap-gutter">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          {/* Chip kategori: tombol desain -> <Link> ?kategori= (bekerja tanpa JavaScript); chip aktif memakai kelas tombol pertama */}
          <nav className="flex flex-wrap gap-2" aria-label="Filter kategori program">
            {[{ slug: '', label: 'Semua Kategori' }, ...KATEGORI_PROGRAM].map((k) =>
              k.slug === kategori ? (
                <Link key={k.slug || 'semua'} className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-full pressed-paper-shadow transition-transform hover:scale-105" href={buatHref({ ...filterAktif, kategori: k.slug })} aria-current="true">{k.label}</Link>
              ) : (
                <Link key={k.slug || 'semua'} className="bg-surface text-on-surface border border-tertiary font-label-md text-label-md px-4 py-2 rounded-full hover:bg-surface-container transition-colors" href={buatHref({ ...filterAktif, kategori: k.slug })}>{k.label}</Link>
              ),
            )}
          </nav>
          {/* Satu <select> desain memuat urutan + status; dipecah jadi dua <select> berkelas sama agar keduanya bisa dipilih bersamaan (KEPUTUSAN BARU) */}
          <form method="get" action="/program" className="flex items-center gap-2">
            {kategori ? <input type="hidden" name="kategori" value={kategori} /> : null}
            <label htmlFor="urut" className="font-label-md text-label-md text-on-surface-variant">Urutkan:</label>
            <select id="urut" name="urut" defaultValue={urut || 'terbaru'} className="bg-surface border-tertiary text-on-surface font-body-md text-body-md rounded-lg focus:ring-secondary focus:border-secondary">
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
            </select>
            <label htmlFor="status" className="sr-only">Status program</label>
            <select id="status" name="status" defaultValue={status} className="bg-surface border-tertiary text-on-surface font-body-md text-body-md rounded-lg focus:ring-secondary focus:border-secondary">
              <option value="">Semua Status</option>
              {STATUS_PROGRAM.map((s) => (
                <option key={s.slug} value={s.slug}>Status: {s.label}</option>
              ))}
            </select>
            {/* Tombol kirim tidak digambar desain — KEPUTUSAN BARU: KELAS_TOMBOL.ringkas + px-4 (kelas yang ada di ZIP) */}
            <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`}>Terapkan</button>
          </form>
        </div>
        {/* Grid Layout */}
        {baris.length === 0 ? (
          <KeadaanKosong
            ikon="explore"
            judul={adaFilter || halaman > 1 ? 'Tidak ada program yang cocok' : 'Belum ada program'}
            keterangan={adaFilter || halaman > 1 ? 'Coba ubah filter kategori atau status, atau kembali ke halaman pertama.' : 'Program dan kegiatan yang dipublikasikan akan tampil di sini.'}
          >
            {adaFilter || halaman > 1 ? (
              <Link href="/program" className="font-label-md text-label-md text-secondary hover:underline">Lihat semua program</Link>
            ) : null}
          </KeadaanKosong>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baris.map((p) => {
              const selesai = p.status === 'selesai';
              const tautan = `/program#program-${p.slug}`;
              // Teks tombol desain berbeda per kartu: kartu observasi "Baca Hasil Observasi", lainnya "Lihat Laporan Detail".
              const teksTombol = p.kategori === 'observasi-kebijakan' ? 'Baca Hasil Observasi' : 'Lihat Laporan Detail';
              return (
                <article key={p.id} id={`program-${p.slug}`} className="bg-surface-lowest border border-tertiary rounded-lg overflow-hidden pressed-paper-shadow flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                  <div className="h-48 relative border-b border-tertiary overflow-hidden bg-surface-container-high">
                    <div className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-500" role="img" aria-label={`Gambar program: ${p.judul}`} style={{ backgroundImage: `url('${p.gambar || '/penampung/program-1.jpg'}')` }}></div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      {selesai ? (
                        <span className="bg-surface-dim text-on-surface font-label-md text-label-md px-3 py-1 rounded-full shadow-sm border border-outline-variant flex items-center gap-1">
                          <Ikon nama="check_circle" className="text-[16px]" /> Selesai
                        </span>
                      ) : (
                        <span className="bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <Ikon nama="pending" className="text-[16px]" /> Berjalan
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3 text-on-surface-variant font-label-md text-label-md">
                      <Ikon nama={ikonKategoriProgram(p.kategori)} className="text-[18px]" />
                      <span className="">{labelKategoriProgram(p.kategori)}</span>
                      <span className="mx-1">•</span>
                      <span className="">{periodeProgram(p.mulai_pada, p.selesai_pada)}</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-3">
                      <Link href={tautan} className="focus:outline-none focus:underline">{p.judul}</Link>
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">{p.ringkasan}</p>
                    <Link href={tautan} className="flex items-center justify-between w-full border-t border-outline-variant pt-4 text-primary font-label-md text-label-md hover:text-secondary-container transition-colors group/btn" aria-label={`${teksTombol}: ${p.judul}`}>
                      <span className="">{teksTombol}</span>
                      <Ikon nama="arrow_forward" className="transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {/* Pagination (Minimalist) — hanya bila lebih dari satu halaman; tombol desain -> <Link> ?halaman= yang mempertahankan filter */}
        {totalHalaman > 1 ? (
          <nav className="flex justify-center items-center gap-2 mt-12" aria-label="Paginasi program">
            {halaman > 1 ? (
              <Link className="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors text-on-surface-variant disabled:opacity-50" href={buatHref({ ...filterAktif, halaman: halaman - 1 })} aria-label="Halaman sebelumnya"><Ikon nama="chevron_left" /></Link>
            ) : (
              <span className="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors text-on-surface-variant disabled:opacity-50 opacity-50" aria-disabled="true"><Ikon nama="chevron_left" /></span>
            )}
            {daftarNomor(halaman, totalHalaman).map((n, i) =>
              n === null ? (
                <span key={`elipsis-${i}`} className="text-outline mx-1">...</span>
              ) : n === halaman ? (
                <span key={n} className="w-10 h-10 border border-primary bg-primary text-on-primary rounded font-label-md text-label-md flex items-center justify-center" aria-current="page">{n}</span>
              ) : (
                <Link key={n} className="w-10 h-10 border border-outline-variant rounded font-label-md text-label-md flex items-center justify-center hover:bg-surface-container text-on-surface-variant" href={buatHref({ ...filterAktif, halaman: n })} aria-label={`Halaman ${n}`}>{n}</Link>
              ),
            )}
            {halaman < totalHalaman ? (
              <Link className="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors text-on-surface-variant" href={buatHref({ ...filterAktif, halaman: halaman + 1 })} aria-label="Halaman berikutnya"><Ikon nama="chevron_right" /></Link>
            ) : (
              <span className="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors text-on-surface-variant opacity-50" aria-disabled="true"><Ikon nama="chevron_right" /></span>
            )}
          </nav>
        ) : null}
        {total > 0 ? <p className="sr-only" aria-live="polite">Menampilkan {baris.length} dari {total} program.</p> : null}
      </section>
    </main>
  );
}
