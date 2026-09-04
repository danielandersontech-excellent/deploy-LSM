'use client';
// components/publik/BilahKategori.js — RUN QA-4 B: BILAH KATEGORI BERITA di bawah navbar, semua halaman publik.
// Pola bilah kategori portal berita (seperti Antara), GAYA WARKOP: latar bg-primary + teks on-primary (token
// desain), kategori aktif memakai kelas tautan aktif navbar desain (emas secondary-fixed-dim + garis bawah).
//   * 11 kategori urut lib/kategoriBerita.js / tabel kategori_artikel (dikirim dari layout server).
//   * Layar sempit: dapat digeser menyamping (overflow-x-auto, item whitespace-nowrap, tanpa terpotong),
//     batang gulir disembunyikan (.hide-scrollbar); item aktif digulir ke tengah saat halaman dimuat.
//   * Klik -> /berita?kategori=<slug> (URL bisa dibagikan). Di dalam /berita sendiri navigasi memakai
//     scroll={false} agar posisi gulir tidak melompat (pola QA-2 B6); dari halaman lain, gulir ke atas wajar.
//   * Keyboard: semua item adalah <a> biasa (Tab/Enter), fokus terlihat (focus-visible ring emas).
// Halaman staf TIDAK memakai komponen ini (hanya app/(publik)/layout.js).
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';

const KELAS_ITEM = 'font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200 whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim rounded-sm';
const KELAS_ITEM_AKTIF = 'font-label-md text-label-md text-secondary-fixed-dim font-bold border-b-2 border-secondary-fixed-dim pb-1 opacity-90 transition-all duration-150 whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim rounded-sm';

export default function BilahKategori({ kategori = [] }) {
  const pathname = usePathname() || '/';
  const sp = useSearchParams();
  const aktif = pathname === '/berita' ? (sp?.get('kategori') || '') : '';
  const refAktif = useRef(null);

  // Item aktif digulir ke tengah bilah (hanya bilahnya, bukan halaman) saat halaman dimuat / kategori berganti.
  useEffect(() => {
    const el = refAktif.current;
    if (!el || typeof el.scrollIntoView !== 'function') return;
    try { el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' }); } catch { /* peramban lama */ }
  }, [aktif]);

  if (!kategori.length) return null;
  return (
    <nav className="bg-primary dark:bg-primary-container text-on-primary border-b border-outline-variant" aria-label="Kategori berita">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <ul className="flex items-center gap-5 2xl:gap-8 overflow-x-auto hide-scrollbar" role="list">
          {kategori.map((k) => {
            const sedangAktif = aktif === k.slug;
            return (
              <li key={k.slug} className="shrink-0" ref={sedangAktif ? refAktif : undefined}>
                <Link
                  href={`/berita?kategori=${encodeURIComponent(k.slug)}`}
                  className={sedangAktif ? KELAS_ITEM_AKTIF : KELAS_ITEM}
                  aria-current={sedangAktif ? 'page' : undefined}
                  scroll={pathname !== '/berita'}
                  title={`Berita ${k.nama}`}
                >
                  <Ikon nama={k.ikon || 'article'} className="text-[16px]" />
                  {k.nama}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
