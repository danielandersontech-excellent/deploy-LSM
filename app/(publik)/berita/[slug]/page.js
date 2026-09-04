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
import BadanArtikel, { siapkanIsi } from '@/components/publik/BadanArtikel';
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

/** Sanitasi lapisan kedua + kelas drop-cap pada paragraf pertama (seperti <p class="drop-cap"> desain). */

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

  const gambarUtama = artikel.gambar_utama || '/penampung/artikel-1.jpg';
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
      <BadanArtikel artikel={artikel} tag={tag} />
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
