// components/publik/BadanArtikel.js — BADAN ARTIKEL (server component) yang dipakai BERSAMA oleh halaman detail publik
// /berita/[slug] dan pratinjau staf /staf/artikel/[id]/pratinjau (QA-2 B8, ala WordPress: draf dirender dengan komponen &
// kelas yang SAMA dengan halaman publik). Markup verbatim dari detail_artikel_investigasi/code.html (dipindahkan apa adanya
// dari app/(publik)/berita/[slug]/page.js). Sanitasi lapisan kedua (siapkanIsi) berlaku untuk keduanya.
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import TombolBagikan from '@/components/publik/TombolBagikan';
import { sanitasiIsiArtikel } from '@/lib/sanitasi';
import { formatTanggalID } from '@/lib/utils';

const KELAS_ISI = [
  '[&_h1]:font-headline-lg [&_h1]:text-headline-lg [&_h1]:text-primary [&_h1]:mt-10 [&_h1]:mb-4',
  '[&_h2]:font-headline-lg [&_h2]:text-headline-lg [&_h2]:text-primary [&_h2]:mt-10 [&_h2]:mb-4',
  '[&_h3]:font-headline-md [&_h3]:text-headline-md [&_h3]:text-primary [&_h3]:mt-8 [&_h3]:mb-3',
  '[&_h4]:font-headline-md [&_h4]:text-headline-md [&_h4]:text-primary [&_h4]:mt-8 [&_h4]:mb-3',
  '[&_blockquote]:my-10 [&_blockquote]:p-6 [&_blockquote]:bg-surface-container-low [&_blockquote]:border-l-4 [&_blockquote]:border-secondary [&_blockquote]:text-primary [&_blockquote]:font-headline-md [&_blockquote]:text-headline-md [&_blockquote]:italic [&_blockquote]:relative',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_a]:text-secondary [&_a]:underline',
  '[&_img]:w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:border [&_img]:border-outline-variant',
  '[&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-on-surface-variant [&_figcaption]:font-body-md [&_figcaption]:text-right [&_figcaption]:italic',
  '[&_pre]:bg-surface-container [&_pre]:p-6 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-sm',
  '[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-outline-variant [&_td]:border-outline-variant [&_th]:p-2 [&_td]:p-2 [&_th]:text-left [&_th]:bg-surface-container',
].join(' ');

function siapkanIsi(html) {
  const bersih = sanitasiIsiArtikel(html);
  return bersih.replace(/^(\s*)<p>/, '$1<p class="drop-cap">');
}

export { siapkanIsi };

/**
 * @param {{ artikel: object, tag: Array<{id:number,nama:string,slug?:string}>, pratinjau?: boolean }} props
 * pratinjau=true: tautan tag/breadcrumb tetap dirender tetapi tanggal memakai diperbarui_pada bila belum terbit.
 */
export default function BadanArtikel({ artikel, tag = [], pratinjau = false }) {
  const tanggal = formatTanggalID(artikel.terbit_pada || artikel.diperbarui_pada || artikel.dibuat_pada || new Date(), 'panjang');
  const gambarUtama = artikel.gambar_utama || '/penampung/artikel-1.jpg';
  const isiHtml = siapkanIsi(artikel.isi || '');
  return (
      <>
      {/* Article Header Container */}
    <article className="max-w-[720px] mx-auto">
      {/* Metadata & Breadcrumb */}
      <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-6 uppercase tracking-wider">
        <Link className="hover:text-secondary transition-colors" href="/berita">Berita</Link>
        <Ikon nama="chevron_right" className="text-[16px]" />
        <span>{artikel.kategori_nama}</span>
      </div>
      <h1 className="font-headline-xl text-headline-xl text-primary mb-6">{artikel.judul}</h1>
      {artikel.ringkasan ? (
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 italic">
          {artikel.ringkasan}
        </p>
      ) : null}
      {/* Author Byline */}
      <div className="flex items-center justify-between border-t border-b border-tertiary py-4 mb-8">
        <div className="flex items-center gap-4">
          <Image alt={`${artikel.penulis_nama}, lambang WARKOP NUSANTARA`} className="w-12 h-12 rounded-full object-cover border border-outline-variant" src="/logo-warkop.png" width={64} height={64} />
          <div>
            <div className="font-label-md text-label-md text-primary">{artikel.penulis_nama}</div>
            <div className="font-body-md text-body-md text-on-surface-variant text-sm">
              {artikel.wilayah_nama ? `${artikel.wilayah_nama} | ` : ''}
              <time dateTime={artikel.terbit_pada ? new Date(artikel.terbit_pada).toISOString() : undefined}>{tanggal}</time>
            </div>
          </div>
        </div>
        {/* Social Share Bar (Inline) */}
        <TombolBagikan judul={artikel.judul} ringkasan={artikel.ringkasan || ''} />
      </div>
      {/* Hero Image */}
      <div className="mb-10 w-full relative">
        <Image alt={artikel.judul} className="w-full h-auto rounded-lg shadow-sm border border-outline-variant object-cover aspect-[16/9]" src={gambarUtama} width={1200} height={800} priority sizes="(max-width: 768px) 100vw, 720px" />
        <div className="absolute top-4 left-4 bg-secondary-fixed text-on-secondary-fixed-variant px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1 shadow-sm border border-secondary-fixed-dim">
          <Ikon nama="verified" className="text-[16px]" />
          {artikel.kategori_nama}
        </div>
      </div>
      {/* Article Body */}
      <div className={`font-body-lg text-body-lg text-on-surface space-y-6 leading-relaxed ${KELAS_ISI}`} dangerouslySetInnerHTML={{ __html: isiHtml }} />
      {/* Tags */}
      {tag.length > 0 ? (
        <div className="mt-10 pt-6 border-t border-tertiary flex flex-wrap gap-2">
          {tag.map((t) => (
            <Link key={t.id} className="px-3 py-1 bg-surface-container rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high cursor-pointer transition-colors" href={`/berita?q=${encodeURIComponent(t.nama)}`}>{t.nama}</Link>
          ))}
        </div>
      ) : null}
    </article>
    </>
  );
}
