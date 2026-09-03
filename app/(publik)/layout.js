// app/(publik)/layout.js — kerangka seluruh halaman publik: navbar + footer kanonik (REFERENSI 18.3).
// Tautan "lewati ke konten" (aksesibilitas, TAHAP-04) menuju #konten-utama — setiap halaman
// memberi id itu pada <main>-nya. Seluruh halaman publik membaca basis data saat permintaan,
// jadi segmen ini dinamis (tidak diprarender saat `next build` di dalam image Docker tanpa DB).
import HeaderPublik from '@/components/publik/HeaderPublik';
import FooterPublik from '@/components/publik/FooterPublik';

export const dynamic = 'force-dynamic';

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
      {children}
      <FooterPublik />
    </>
  );
}
