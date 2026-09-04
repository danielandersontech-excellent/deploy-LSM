// app/(publik)/layout.js — kerangka seluruh halaman publik: navbar + footer kanonik (REFERENSI 18.3).
// Tautan "lewati ke konten" (aksesibilitas, TAHAP-04) menuju #konten-utama — setiap halaman
// memberi id itu pada <main>-nya. Seluruh halaman publik membaca basis data saat permintaan,
// jadi segmen ini dinamis (tidak diprarender saat `next build` di dalam image Docker tanpa DB).
import { Suspense } from 'react';
import HeaderPublik from '@/components/publik/HeaderPublik';
import FooterPublik from '@/components/publik/FooterPublik';
import BilahKategori from '@/components/publik/BilahKategori';
import { ambilKategoriArtikel } from '@/lib/db/artikel';

export const dynamic = 'force-dynamic';

// RUN QA-4 B: bilah kategori berita tepat di bawah navbar pada SEMUA halaman publik (bukan halaman staf).
// Daftar dibaca di server (kategori aktif, urutan final); penanda aktif butuh searchParams sehingga komponen
// bilahnya client dan dibungkus Suspense (aturan useSearchParams App Router).
async function BilahKategoriServer() {
  let kategori = [];
  try {
    kategori = (await ambilKategoriArtikel()).map((k) => ({ slug: k.slug, nama: k.nama, ikon: k.ikon }));
  } catch {
    // basis data tidak terjangkau: halaman tetap tampil tanpa bilah (error.js menangani kegagalan lain)
  }
  return <BilahKategori kategori={kategori} />;
}

export default function LayoutPublik({ children }) {
  return (
    <>
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg font-label-md text-label-md"
      >
        Lewati ke konten
      </a>
      <HeaderPublik />
      <Suspense fallback={null}>
        <BilahKategoriServer />
      </Suspense>
      {children}
      <FooterPublik />
    </>
  );
}
