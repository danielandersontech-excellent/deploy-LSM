// components/publik/berita/SorotanBerita.js — sorotan utama bergambar besar (kelas VERBATIM
// portal_berita_beranda/code.html "Featured Investigasi"), dipindahkan dari app/(publik)/berita/page.js
// pada RUN QA-4 C agar dipakai bersama oleh /berita dan beranda berita.
// `tingkatJudul`: 'h2' bila halaman sudah punya h1 lain (/berita), 'h1' pada beranda berita.
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import TautanKartu from '@/components/publik/TautanKartu';
import { formatTanggalID } from '@/lib/utils';
import { ikonKategoriBerita } from '@/lib/kategoriBerita';

export default function SorotanBerita({ sorotan, tingkatJudul = 'h2' }) {
  const Judul = tingkatJudul === 'h1' ? 'h1' : 'h2';
  return (
    <section aria-label="Sorotan utama">
      <div className="group cursor-pointer relative overflow-hidden rounded-xl border border-tertiary/10 bg-surface-lowest shadow-sm hover:shadow-md transition-shadow">
        <TautanKartu href={`/berita/${sorotan.slug}`} />
        <div className="aspect-video w-full overflow-hidden relative">
          <Image className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={sorotan.gambar_utama || '/penampung/artikel-1.jpg'} alt={`Gambar utama: ${sorotan.judul}`} fill sizes="(min-width: 1280px) 880px, (min-width: 768px) calc(100vw - 424px), 100vw" priority />
          <div className="absolute top-4 left-4">
            <span className="bg-secondary-fixed-dim text-primary px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1 shadow-sm">
              <Ikon nama={ikonKategoriBerita(sorotan.kategori_slug, sorotan.kategori_ikon)} className="text-[16px]" />
              {sorotan.kategori_nama}
            </span>
          </div>
        </div>
        <div className="p-6 md:p-8 bg-surface-bright border-t-4 border-secondary-fixed-dim">
          <div className="flex items-center gap-4 text-on-surface-variant font-label-md text-label-md mb-4">
            <span className="flex items-center gap-1"><Ikon nama="calendar_today" className="text-[18px]" /> {formatTanggalID(sorotan.terbit_pada, 'panjang')}</span>
            <span className="text-tertiary/20">|</span>
            <span className="flex items-center gap-1"><Ikon nama="person" className="text-[18px]" /> Oleh {sorotan.penulis_nama}</span>
          </div>
          <Judul className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-primary mb-4 group-hover:text-secondary-fixed-dim transition-colors">
            <Link href={`/berita/${sorotan.slug}`} className="focus:outline-none focus:underline">{sorotan.judul}</Link>
          </Judul>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 line-clamp-3">
            {sorotan.ringkasan}
          </p>
          <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-secondary-fixed-dim transition-colors font-bold uppercase tracking-wider" href={`/berita/${sorotan.slug}`} aria-label={`Baca Laporan Lengkap: ${sorotan.judul}`}>
            Baca Laporan Lengkap <Ikon nama="arrow_forward" />
          </Link>
        </div>
      </div>
    </section>
  );
}
