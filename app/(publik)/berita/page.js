// app/(publik)/berita/page.js — DAFTAR BERITA. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari daftar_berita_investigasi/code.html (layar utama,
// screen.png 1519 px valid). Bagian yang TIDAK ada di layar utama tetapi diminta TAHAP-05 §1 —
// sorotan utama (kartu besar) dan sisi kanan "Paling Banyak Dibaca" — disalin dari
// portal_berita_beranda/code.html (screen.png rusak; code.html satu-satunya sumber).
// Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) gambar googleusercontent ->
// next/image dengan `gambar_utama` dari DB, (c) href/button -> rute sungguhan, (d) bagian
// DINAMIS (kartu, sorotan, opsi kategori, paling dibaca) -> tabel `artikel`/`kategori_artikel`,
// (e) elemen berulang -> .map() memakai kelas elemen PERTAMA, (f) JSX. Navbar/footer dari layout (18.3).
//
// Filter WAJIB tercermin di URL dan bekerja tanpa JavaScript (<form method="get">):
//   ?q=<kata>            — pencarian judul/ringkasan/isi (kotak cari navbar juga mengirim ke sini)
//   ?kategori=<slug>     — hanya slug yang ada di kategori_artikel; selain itu diperlakukan kosong
//   ?rentang=30|90|tahun-ini — "Rentang Waktu" desain (KEPUTUSAN BARU, lihat laporan)
//   ?halaman=N           — paginasi (components/ui/Paginasi: kelas verbatim dari layar ini)
// Sorotan utama = baris pertama hasil pada tampilan bawaan (tanpa filter, halaman 1) — sama
// dengan ambilArtikelSorotan(1) tanpa kueri tambahan dan tanpa duplikasi kartu.
import Link from 'next/link';
import KirimOtomatis from '@/components/publik/KirimOtomatis';
import { cache } from 'react';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import Paginasi from '@/components/ui/Paginasi';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';
import SorotanBerita from '@/components/publik/berita/SorotanBerita';
import KartuBerita from '@/components/publik/berita/KartuBerita';
import { PalingDibaca, WidgetLaporan } from '@/components/publik/berita/SisiBerita';
import { ambilArtikelTerbit, ambilArtikelPalingDibaca, ambilKategoriArtikel } from '@/lib/db/artikel';
// RUN QA-4 C: markup sorotan, kartu, dan sisi kanan dipindah ke components/publik/berita/* (dipakai juga beranda berita).

// 3 kolom (lg:grid-cols-3) × 2 baris per halaman.
const PER_HALAMAN = 6;
const RENTANG_SAH = ['30', '90', 'tahun-ini'];
const PANJANG_Q_MAKS = 100;
const JUMLAH_PALING_DIBACA = 5;
const DESKRIPSI = 'Arsip berita, laporan masyarakat, dan tindak lanjut pengawasan yang telah diverifikasi oleh tim WARKOP NUSANTARA.';

// Satu kueri kategori per permintaan (dipakai generateMetadata dan halaman).
const daftarKategori = cache(() => ambilKategoriArtikel());

/** Ambil satu nilai string dari searchParams (bisa array bila kunci diulang). */
function satuNilai(v) {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

/** Validasi parameter URL: kategori hanya slug yang ada, rentang dari daftar sah, halaman bilangan bulat ≥ 1. */
function bacaFilter(sp, slugSah) {
  const q = String(satuNilai(sp?.q)).trim().slice(0, PANJANG_Q_MAKS);
  const kategoriMentah = satuNilai(sp?.kategori);
  const rentangMentah = satuNilai(sp?.rentang);
  const halamanMentah = Number.parseInt(satuNilai(sp?.halaman), 10);
  return {
    q,
    kategori: slugSah.includes(kategoriMentah) ? kategoriMentah : '',
    rentang: RENTANG_SAH.includes(rentangMentah) ? rentangMentah : '',
    halaman: Number.isInteger(halamanMentah) && halamanMentah >= 1 ? halamanMentah : 1,
  };
}

/** Bangun href /berita dengan filter yang dipertahankan; nilai kosong dan halaman 1 tidak ditulis. */
function buatHref({ q, kategori, rentang, halaman }) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (kategori) p.set('kategori', kategori);
  if (rentang) p.set('rentang', rentang);
  if (halaman && halaman > 1) p.set('halaman', String(halaman));
  const s = p.toString();
  return s ? `/berita?${s}` : '/berita';
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const kategoriList = await daftarKategori();
  const { q, kategori } = bacaFilter(sp, kategoriList.map((k) => k.slug));
  const namaKategori = kategoriList.find((k) => k.slug === kategori)?.nama;
  let title = 'Berita & Investigasi';
  if (q && namaKategori) title = `Pencarian "${q}" di ${namaKategori} - Berita & Investigasi`;
  else if (q) title = `Pencarian "${q}" - Berita & Investigasi`;
  else if (namaKategori) title = `${namaKategori} - Berita & Investigasi`;
  return { title, description: DESKRIPSI };
}

export default async function HalamanBerita({ searchParams }) {
  const sp = await searchParams;
  const kategoriList = await daftarKategori();
  const { q, kategori, rentang, halaman: halamanDiminta } = bacaFilter(sp, kategoriList.map((k) => k.slug));

  const [hasil, palingDibaca] = await Promise.all([
    ambilArtikelTerbit({
      kategoriSlug: kategori || null,
      q: q || null,
      rentang: rentang || null,
      halaman: halamanDiminta,
      perHalaman: PER_HALAMAN,
    }),
    ambilArtikelPalingDibaca(JUMLAH_PALING_DIBACA),
  ]);
  const { baris, total, halaman, totalHalaman } = hasil;
  const filterAktif = { q, kategori, rentang };
  const adaFilter = Boolean(q || kategori || rentang);

  // Sorotan hanya pada tampilan bawaan; kartu grid = sisa baris agar artikel tidak tampil dua kali.
  const sorotan = !adaFilter && halaman === 1 && baris.length > 0 ? baris[0] : null;
  const kartu = sorotan ? baris.slice(1) : baris;

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Page Header & Filtering */}
      <section className="mb-12 border-b border-outline-variant pb-8">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-4">Arsip Berita &amp; Observasi</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-3xl">
          Pantau perkembangan terkini, laporan masyarakat, dan tindak lanjut pengawasan yang telah diverifikasi oleh tim Warkop Nusantara. Transparansi adalah kunci integritas.
        </p>
        {/* Pembungkus <form> tanpa kelas: filter desain bekerja tanpa JavaScript (GET ke URL yang bisa dibagikan) */}
        <form method="get" action="/berita" role="search" aria-label="Saring berita">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-container-lowest p-6 rounded-lg border border-outline-variant shadow-sm relative overflow-hidden">
            {/* Decorative subtle skeuomorphic texture accent (implied by guidelines) */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#271310 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            <div className="w-full md:w-1/2 relative z-10">
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="search">Pencarian Kata Kunci</label>
              <div className="relative">
                <Ikon nama="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary-fixed-dim focus:border-b-2 transition-all" id="search" name="q" defaultValue={q} maxLength={PANJANG_Q_MAKS} placeholder="Cari laporan, wilayah, atau topik..." type="text" />
              </div>
            </div>
            <div className="w-full md:w-1/4 relative z-10">
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="category">Kategori Observasi</label>
              <div className="relative">
                <select className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary-fixed-dim focus:border-b-2 transition-all appearance-none cursor-pointer" id="category" name="kategori" defaultValue={kategori}>
                  <option value="">Semua Kategori</option>
                  {kategoriList.map((k) => (
                    <option key={k.slug} value={k.slug}>{k.nama}</option>
                  ))}
                </select>
                <Ikon nama="arrow_drop_down" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>
            <div className="w-full md:w-1/4 relative z-10">
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="date">Rentang Waktu</label>
              <div className="relative">
                <select className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary-fixed-dim focus:border-b-2 transition-all appearance-none cursor-pointer" id="date" name="rentang" defaultValue={rentang}>
                  <option value="">Terbaru</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">3 Bulan Terakhir</option>
                  <option value="tahun-ini">Tahun Ini</option>
                </select>
                <Ikon nama="arrow_drop_down" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>
            {/* QA-1: desain tanpa tombol — <select> langsung berlaku (KirimOtomatis); tombol hanya tampil tanpa JavaScript */}
            <KirimOtomatis />
            <noscript>
              <div className="w-full md:w-auto relative z-10">
                <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4 w-full`}>Terapkan</button>
              </div>
            </noscript>
          </div>
        </form>
      </section>
      {/* Dua kolom (portal_berita_beranda): kolom utama + sisi kanan */}
      <div className="flex flex-col md:flex-row gap-gutter">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-12">
          {/* Featured Investigasi — sorotan utama (portal_berita_beranda) */}
          {sorotan ? <SorotanBerita sorotan={sorotan} /> : null}
          {/* Divider */}
          {sorotan && kartu.length > 0 ? <hr className="border-tertiary/10" /> : null}
          {/* Article Grid */}
          {kartu.length === 0 && !sorotan ? (
            <KeadaanKosong
              ikon="article"
              judul={adaFilter || halaman > 1 ? 'Tidak ada berita yang cocok' : 'Belum ada berita'}
              keterangan={adaFilter || halaman > 1 ? 'Coba ubah kata kunci, kategori, atau rentang waktu, atau kembali ke halaman pertama.' : 'Berita dan laporan investigasi yang diterbitkan akan tampil di sini.'}
            >
              {adaFilter || halaman > 1 ? (
                <Link href="/berita" className="font-label-md text-label-md text-secondary hover:underline">Lihat semua berita</Link>
              ) : null}
            </KeadaanKosong>
          ) : kartu.length > 0 ? (
            <div>
              {/* QA-1: di dalam kolom utama (2/3 lebar) grid mengikuti portal_berita_beranda "Berita Terkini" (md:grid-cols-2 gap-6); lg:grid-cols-3 membuat kartu terjepit & judul terpotong */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Daftar artikel">
                {kartu.map((a) => <KartuBerita key={a.id} a={a} />)}
              </section>
              {/* Pagination — tombol desain -> <Link> ?halaman= yang mempertahankan q/kategori/rentang */}
              <Paginasi halaman={halaman} totalHalaman={totalHalaman} buatHref={(n) => buatHref({ ...filterAktif, halaman: n })} />
            </div>
          ) : null}
          {total > 0 ? <p className="sr-only" aria-live="polite">Menampilkan {baris.length} dari {total} berita.</p> : null}
        </div>
        {/* Sidebar (portal_berita_beranda) */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-8">
          <PalingDibaca palingDibaca={palingDibaca} />
          <WidgetLaporan />
        </aside>
      </div>
    </main>
  );
}
