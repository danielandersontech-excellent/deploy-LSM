// components/publik/berita/KartuBerita.js — kartu artikel grid (kelas VERBATIM daftar_berita_investigasi/code.html,
// dipindahkan apa adanya dari app/(publik)/berita/page.js pada RUN QA-4 C agar dipakai bersama oleh /berita dan
// beranda berita). Lencana kategori kini memuat ikon kategori (RUN QA-4 A: ikon Material per kategori).
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import TautanKartu from '@/components/publik/TautanKartu';
import { formatTanggalID } from '@/lib/utils';
import { ikonKategoriBerita } from '@/lib/kategoriBerita';

export default function KartuBerita({ a, ukuranGambar = '(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw' }) {
  return (
    <article className="flex flex-col bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden group hover:border-secondary-fixed-dim transition-all duration-300 relative shadow-sm hover:shadow-md cursor-pointer">
      <TautanKartu href={`/berita/${a.slug}`} />
      <div className="h-48 w-full relative overflow-hidden bg-surface-container-high border-b border-outline-variant">
        <Image className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={a.gambar_utama || '/penampung/artikel-1.jpg'} alt={`Gambar utama: ${a.judul}`} fill sizes={ukuranGambar} />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <span className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 py-1 rounded-full border border-secondary inline-flex items-center gap-1">
            <Ikon nama={ikonKategoriBerita(a.kategori_slug, a.kategori_ikon)} className="text-[14px]" />
            {a.kategori_nama}
          </span>
          <div className="flex items-center text-outline text-sm gap-1" title="Verified Truth">
            <Ikon nama="verified" className="text-base" />
          </div>
        </div>
        <h2 className="font-headline-md text-headline-md text-primary mb-3 leading-tight group-hover:text-secondary transition-colors line-clamp-2">
          <Link href={`/berita/${a.slug}`} className="focus:outline-none focus:underline">{a.judul}</Link>
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-grow line-clamp-3">
          {a.ringkasan}
        </p>
        <div className="pt-4 border-t border-outline-variant flex justify-between items-center mt-auto">
          <div className="flex items-center gap-2">
            <Ikon nama="account_circle" className="text-outline" />
            <span className="font-label-md text-label-md text-on-surface">{a.penulis_nama}</span>
          </div>
          <span className="font-body-md text-body-md text-on-surface-variant text-sm">{formatTanggalID(a.terbit_pada, 'singkat')}</span>
        </div>
      </div>
    </article>
  );
}
