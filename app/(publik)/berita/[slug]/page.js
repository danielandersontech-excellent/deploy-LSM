// app/(publik)/berita/[slug]/page.js — DETAIL ARTIKEL. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari detail_artikel_investigasi/code.html
// (screen.png 703 px valid). Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>,
// (b) gambar googleusercontent -> gambar_utama dari DB / logo lokal, (c) href="#" -> rute
// sungguhan, (d) bagian DINAMIS (remah roti kategori, judul, ringkasan, byline, gambar utama,
// lencana, isi, tag, artikel terkait) -> tabel `artikel`, (e) tag & kartu terkait -> .map(),
// (f) JSX. Navbar/footer dari layout (18.3). Tombol bagikan -> components/publik/TombolBagikan.
//
// Isi artikel = HTML hasil editor yang SUDAH disanitasi saat disimpan (lib/sanitasi.js);
// di sini disanitasi lagi (lapisan kedua) sebelum dangerouslySetInnerHTML.
// Jumlah dibaca dinaikkan saat render KECUALI User-Agent bot (lib/bot.js) — TAHAP-05 uji h.
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import TombolBagikan from '@/components/publik/TombolBagikan';
import { ambilArtikelBySlug, ambilArtikelTerkait, ambilTagArtikel, naikkanJumlahDibaca } from '@/lib/db/artikel';
import { sanitasiIsiArtikel, teksPolos } from '@/lib/sanitasi';
import { formatTanggalID } from '@/lib/utils';
import { adalahBot } from '@/lib/bot';

// Satu kueri untuk generateMetadata + halaman (dedup per permintaan).
const ambilArtikel = cache((slug) => ambilArtikelBySlug(slug, { hanyaTerbit: true }));

// KEPUTUSAN BARU — hierarki tipografi isi editor (tanpa kelas) lewat selector turunan Tailwind.
// Setiap kelas diambil dari elemen setara di code.html layar ini:
//   h1/h2  -> h2 badan artikel: font-headline-lg text-headline-lg text-primary mt-10 mb-4
//   h3/h4  -> headline-md (kelas h4 kartu terkait/blockquote) + mt-8 mb-3 (jarak yang ada di desain)
//   blockquote -> kelas blockquote desain (my-10 p-6 bg-surface-container-low border-l-4
//                 border-secondary text-primary font-headline-md text-headline-md italic relative);
//                 ikon format_quote dekoratif + div pl-6 tidak dibuat (isi editor tak punya pembungkus)
//   img    -> kelas gambar utama (w-full h-auto rounded-lg shadow-sm border border-outline-variant)
//   figcaption -> kelas keterangan foto desain (mt-2 text-sm text-on-surface-variant font-body-md text-right italic)
//   ul/ol  -> list-disc (ada di ZIP) / list-decimal + pl-6; a -> text-secondary underline (hover:underline ada di ZIP)
//   pre/table -> bg-surface-container, border-outline-variant, p-2/p-6, rounded-lg (token yang ada di ZIP)
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

/** Sanitasi lapisan kedua + kelas drop-cap pada paragraf pertama (seperti <p class="drop-cap"> desain). */
function siapkanIsi(html) {
  const bersih = sanitasiIsiArtikel(html);
  return bersih.replace(/^(\s*)<p>/, '$1<p class="drop-cap">');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const artikel = await ambilArtikel(slug);
  if (!artikel) return { title: 'Artikel tidak ditemukan' };
  const deskripsi = artikel.ringkasan || teksPolos(artikel.isi, 160);
  return {
    title: artikel.judul,
    description: deskripsi,
    alternates: { canonical: `/berita/${artikel.slug}` },
    openGraph: {
      type: 'article',
      title: artikel.judul,
      description: deskripsi,
      url: `/berita/${artikel.slug}`,
      publishedTime: artikel.terbit_pada ? new Date(artikel.terbit_pada).toISOString() : undefined,
      modifiedTime: artikel.diperbarui_pada ? new Date(artikel.diperbarui_pada).toISOString() : undefined,
      authors: artikel.penulis_nama ? [artikel.penulis_nama] : undefined,
      images: artikel.gambar_utama ? [artikel.gambar_utama] : undefined,
    },
  };
}

export default async function HalamanDetailArtikel({ params }) {
  const { slug } = await params;
  const artikel = await ambilArtikel(slug);
  if (!artikel) notFound();

  // Jumlah dibaca: hanya pengunjung manusia (UA bukan bot). Gagal menulis tidak boleh
  // menggagalkan halaman — penghitung bukan data inti.
  const h = await headers();
  const bot = adalahBot(h.get('user-agent'));
  if (!bot) {
    try { await naikkanJumlahDibaca(artikel.id); } catch (e) { console.error('[detail-artikel] gagal menaikkan jumlah_dibaca:', e?.message); }
  }

  const [tag, terkait] = await Promise.all([
    ambilTagArtikel(artikel.id),
    ambilArtikelTerkait(artikel.id, artikel.kategori_id, 3),
  ]);

  const tanggal = formatTanggalID(artikel.terbit_pada, 'panjang');
  const gambarUtama = artikel.gambar_utama || '/penampung/artikel-1.jpg';
  const isiHtml = siapkanIsi(artikel.isi);
  const dasarUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // JSON-LD NewsArticle (SEO, TAHAP-05 uji k). Nama penulis adalah nama publik staf (bukan identitas pelapor).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: artikel.judul,
    description: artikel.ringkasan || teksPolos(artikel.isi, 160),
    image: [`${dasarUrl}${gambarUtama}`],
    datePublished: artikel.terbit_pada ? new Date(artikel.terbit_pada).toISOString() : undefined,
    dateModified: artikel.diperbarui_pada ? new Date(artikel.diperbarui_pada).toISOString() : undefined,
    author: [{ '@type': 'Person', name: artikel.penulis_nama }],
    publisher: { '@type': 'Organization', name: 'WARKOP NUSANTARA', logo: { '@type': 'ImageObject', url: `${dasarUrl}/logo-warkop.png` } },
    articleSection: artikel.kategori_nama,
    keywords: tag.map((t) => t.nama).join(', ') || undefined,
    mainEntityOfPage: `${dasarUrl}/berita/${artikel.slug}`,
    ...(artikel.wilayah_nama ? { contentLocation: { '@type': 'Place', name: artikel.wilayah_nama } } : {}),
  };

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
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
            <Image alt={`${artikel.penulis_nama} — lambang WARKOP NUSANTARA`} className="w-12 h-12 rounded-full object-cover border border-outline-variant" src="/logo-warkop.png" width={64} height={64} />
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
      {/* Related Articles Section (Bento Grid Style) */}
      {terkait.length > 0 ? (
        <section className="mt-20 border-t border-outline-variant pt-12">
          <h3 className="font-headline-lg text-headline-lg text-primary mb-8 text-center">Artikel Terkait</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-container-max mx-auto">
            {terkait.map((a) => (
              <Link key={a.id} className="group block bg-surface rounded-lg border border-outline-variant overflow-hidden hover:shadow-md transition-shadow duration-300 relative flex flex-col h-full" href={`/berita/${a.slug}`}>
                <div className="h-48 w-full overflow-hidden bg-surface-container relative">
                  <Image alt={a.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={a.gambar_utama || '/penampung/artikel-1.jpg'} fill sizes="(max-width: 768px) 100vw, 400px" />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="font-label-md text-label-md text-secondary mb-2">{a.kategori_nama}</div>
                  <h4 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors">{a.judul}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 mt-auto">{a.ringkasan}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
