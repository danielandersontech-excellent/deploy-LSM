'use client';
// components/publik/NavPublik.js — bagian client dari navbar kanonik (REFERENSI 18.3).
// DOM + kelas Tailwind disalin apa adanya dari markup kanonik; enam perubahan 18.2:
//   (a) span material-symbols -> <Ikon>, (b) img googleusercontent -> next/image lokal,
//   (c) href="#" -> rute lib/navItems.js, (f) sintaks JSX.
// Aturan turunan 18.3: tautan aktif = kelas "Kontak & Pengaduan"; tautan lain = kelas "Beranda";
// kotak cari = <form action="/berita" method="get" name="q">; "Masuk Staff" = <a> ke STAF_HOST.
// KEPUTUSAN BARU (diwajibkan 18.3): tombol hamburger di bawah md membuka laci bg-primary
// berisi menu yang sama, ditumpuk vertikal, gap-4, tanpa animasi.
import { useId, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';

const KELAS_TAUTAN = 'font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200';
const KELAS_TAUTAN_AKTIF = 'font-label-md text-label-md text-secondary-fixed-dim font-bold border-b-2 border-secondary-fixed-dim pb-1 opacity-90 transition-all duration-150';

function tautanAktif(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavPublik({ menu, hrefStaf }) {
  const pathname = usePathname() || '/';
  const [laciTerbuka, setLaciTerbuka] = useState(false);
  const [jalurTerakhir, setJalurTerakhir] = useState(pathname);
  const idLaci = useId();

  // Laci ditutup setiap kali rute berganti (pola "turunkan keadaan saat render", bukan setState di effect)
  if (jalurTerakhir !== pathname) {
    setJalurTerakhir(pathname);
    setLaciTerbuka(false);
  }

  const daftarTautan = (kelasTambahan = '') =>
    menu.map((item) => (
      <Link
        key={item.href}
        className={`${tautanAktif(pathname, item.href) ? KELAS_TAUTAN_AKTIF : KELAS_TAUTAN}${kelasTambahan}`}
        href={item.href}
        aria-current={tautanAktif(pathname, item.href) ? 'page' : undefined}
      >
        {item.label}
      </Link>
    ));

  return (
    <header className="bg-primary dark:bg-primary-container docked full-width top-0 border-b border-outline-variant dark:border-outline shadow-sm z-50 sticky">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-unit max-w-container-max mx-auto">
        {/* Merek: kelas verbatim + shrink-0 whitespace-nowrap (KEPUTUSAN BARU Tahap 4, TEMUAN navbar): tanpa itu
            Chrome menyusutkan merek sehingga teks "WARKOP NUSANTARA" membungkus dua baris dan ditimpa tautan menu
            pada 768–1280 px — di seluruh screen.png desain merek selalu satu baris. nowrap hanya md+ (Tahap 6:
            di 375 px nowrap membuat halaman melebar melewati viewport). Dijadikan tautan ke beranda
            seperti varian beranda_warkop_nusantara. */}
        <Link className="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight flex items-center gap-2 max-w-full lg:shrink-0 lg:whitespace-nowrap" href="/">
          <Image alt="WARKOP NUSANTARA Logo" className="h-16 w-16 object-contain rounded-full" src="/logo-warkop.png" width={64} height={64} priority />
          <span className="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight">WARKOP NUSANTARA</span>
        </Link>
        {/* flex-wrap justify-center (kelas nav di layar tentang/struktur/program ZIP) — Tahap 6: tanpa itu navbar
            meluap mendatar pada 768–1024 px (merek + 7 tautan + tombol > lebar); nowrap merek hanya lg+. */}
        <nav className="hidden md:flex flex-wrap justify-center items-center gap-6 mt-4 md:mt-0" aria-label="Navigasi utama">
          {daftarTautan()}
        </nav>
        <div className="flex items-center gap-4">
          <form className="relative hidden lg:block" action="/berita" method="get" role="search">
            <Ikon nama="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
            <label className="sr-only" htmlFor={`${idLaci}-cari`}>Cari berita</label>
            <input id={`${idLaci}-cari`} name="q" className="pl-9 pr-3 py-1.5 rounded-full bg-surface text-on-surface text-sm border border-outline-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary w-48 transition-all" placeholder="Cari..." type="text" />
          </form>
          <a className="hidden md:flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors" href={hrefStaf}>
            Masuk Staff
            <Ikon nama="login" />
          </a>
          {/* Hamburger (KEPUTUSAN BARU 18.3) — hanya di bawah md */}
          <button
            type="button"
            className="md:hidden flex items-center text-on-primary opacity-80 hover:opacity-100 transition-opacity"
            aria-label={laciTerbuka ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={laciTerbuka}
            aria-controls={`${idLaci}-laci`}
            onClick={() => setLaciTerbuka((v) => !v)}
          >
            <Ikon nama={laciTerbuka ? 'close' : 'menu'} className="text-3xl" />
          </button>
        </div>
      </div>
      {/* Laci menu (KEPUTUSAN BARU 18.3): bg-primary, tautan kelas sama, vertikal, gap-4.
          Dirender hanya saat terbuka (Tahap 6: atribut hidden dikalahkan kelas .flex — laci selalu tampak). */}
      {laciTerbuka ? (
      <nav
        id={`${idLaci}-laci`}
        className="md:hidden bg-primary w-full px-margin-mobile pb-4 flex flex-col gap-4"
        aria-label="Navigasi utama (seluler)"
      >
        {daftarTautan()}
        <a className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors self-start" href={hrefStaf}>
          Masuk Staff
          <Ikon nama="login" />
        </a>
      </nav>
      ) : null}
    </header>
  );
}
