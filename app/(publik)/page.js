// app/(publik)/page.js — BERANDA = PORTAL BERITA (RUN QA-4 C, KEPUTUSAN PEMILIK, menyimpang dari desain
// beranda_warkop_nusantara/code.html; dasar kesetiaan diperbarui beserta alasannya di LAPORAN-QA-4.md).
//
// Susunan (memakai pola portal_berita_beranda + daftar_berita_investigasi, token desain penuh):
//   1. Strip identitas LSM (dari hero beranda lama, dipadatkan): lencana "Pengawasan Sipil Independen", nama
//      panjang, motto "Berani Karena Benar", tombol "Sampaikan Pengaduan" dan "Lacak Kasus" (misi tetap menonjol).
//   2. Bilah kategori (layout publik, RUN QA-4 B) sudah tepat di bawah navbar.
//   3. Kolom utama: SOROTAN UTAMA bergambar besar (artikel terbit terbaru) + "Berita Terkini" 6 kartu +
//      tautan "Lihat Semua Berita".
//   4. Sisi kanan: Paling Banyak Dibaca, widget Buat Laporan, dan dua modul yang DIPINDAHKAN dari beranda lama
//      (KEPUTUSAN BARU: dipilih sisi beranda berita, bukan /tentang, supaya statistik dan status advokasi tetap
//      terlihat di halaman pertama tanpa mendesak berita): Status Advokasi (aturan 13: tanpa identitas) dan
//      Rekam Jejak (statistik dari pengaturan).
// /berita tetap ada sebagai arsip lengkap dengan filter; kartu dan sorotan memakai komponen bersama
// components/publik/berita/* sehingga tampilannya identik.
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import SorotanBerita from '@/components/publik/berita/SorotanBerita';
import KartuBerita from '@/components/publik/berita/KartuBerita';
import { PalingDibaca, WidgetLaporan, StatusAdvokasi, RekamJejak } from '@/components/publik/berita/SisiBerita';
import { ambilPengaturan } from '@/lib/db/pengaturan';
import { ambilArtikelTerbit, ambilArtikelPalingDibaca } from '@/lib/db/artikel';
import { ambilKasusBerjalanPublik } from '@/lib/db/pengaduan';
import { formatAngkaID } from '@/lib/utils';

export const metadata = {
  title: { absolute: 'WARKOP NUSANTARA - Berita, Investigasi, dan Kanal Pengaduan Masyarakat' },
  description: 'Portal berita dan investigasi WARKOP NUSANTARA (Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara) beserta kanal pengaduan masyarakat yang melindungi identitas pelapor. Berani Karena Benar.',
  alternates: { canonical: '/' },
  openGraph: { title: 'WARKOP NUSANTARA - Berita & Investigasi', description: 'Berita, laporan investigasi, dan kanal pengaduan masyarakat. Berani Karena Benar.', url: '/' },
};

const JUMLAH_TERKINI = 7; // 1 sorotan + 6 kartu (grid 2 kolom x 3 baris)
const JUMLAH_PALING_DIBACA = 5;

const JSON_LD_ORGANISASI = {
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: 'WARKOP NUSANTARA',
  alternateName: 'Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara',
  slogan: 'Berani Karena Benar',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  logo: `${(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/logo-warkop.png`,
};

export default async function HalamanBeranda() {
  const [setelan, terkini, palingDibaca, kasus] = await Promise.all([
    ambilPengaturan(['statistik_laporan_ditangani', 'statistik_provinsi_tercover', 'statistik_tahun_mengawasi']),
    ambilArtikelTerbit({ halaman: 1, perHalaman: JUMLAH_TERKINI }),
    ambilArtikelPalingDibaca(JUMLAH_PALING_DIBACA),
    ambilKasusBerjalanPublik(2),
  ]);
  const [sorotan, ...kartu] = terkini.baris;
  const statistik = [
    { angka: `${formatAngkaID(setelan.statistik_laporan_ditangani)}+`, label: 'Laporan Ditangani', keterangan: 'Diselesaikan melalui mediasi dan advokasi hukum yang transparan.' },
    { angka: formatAngkaID(setelan.statistik_provinsi_tercover), label: 'Provinsi Tercover', keterangan: 'Jaringan relawan pengawas yang tersebar di seluruh pelosok negeri.' },
    { angka: formatAngkaID(setelan.statistik_tahun_mengawasi), label: 'Tahun Mengawasi', keterangan: 'Konsisten mengawal kebijakan publik sejak didirikan.' },
  ];

  return (
    <main id="konten-utama" className="flex-grow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANISASI) }} />
      {/* Strip identitas LSM — kelas dari hero beranda_warkop_nusantara, dipadatkan (misi tetap menonjol) */}
      <section className="bg-surface-container-lowest border-b border-outline-variant" aria-label="Identitas lembaga">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 border border-secondary-fixed/50 mb-3">
              <Ikon nama="verified_user" terisi className="text-secondary text-sm" />
              <span className="font-label-md text-label-md text-secondary">Pengawasan Sipil Independen</span>
            </div>
            <p className="font-headline-md text-headline-md text-primary leading-tight">
              Wadah Aspirasi Rakyat, <span className="text-secondary">Kontrol, Observasi dan Pengawasan Nusantara</span>
            </p>
            <p className="font-motto text-motto text-on-surface-variant italic mt-2 border-l-4 border-secondary pl-4">&quot;Berani Karena Benar.&quot;</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/kontak" className="bg-primary text-on-primary hover:bg-primary-container px-8 py-4 rounded-lg font-label-md text-label-md transition-all shadow-[0_4px_14px_0_rgba(39,19,16,0.39)] hover:shadow-[0_6px_20px_rgba(39,19,16,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
              <Ikon nama="campaign" />
              Sampaikan Pengaduan
            </Link>
            <Link href="/lacak" className="bg-surface text-primary border border-outline hover:bg-surface-container-low px-8 py-4 rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2">
              <Ikon nama="search" />
              Lacak Kasus
            </Link>
          </div>
        </div>
      </section>

      {/* Portal berita: dua kolom (portal_berita_beranda) */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-gutter">
          <div className="flex-1 min-w-0 flex flex-col gap-12">
            {sorotan ? <SorotanBerita sorotan={sorotan} tingkatJudul="h1" /> : (
              <>
                <h1 className="sr-only">Berita WARKOP NUSANTARA</h1>
                <KeadaanKosong ikon="article" judul="Belum ada berita" keterangan="Berita dan laporan investigasi yang diterbitkan akan tampil di sini." />
              </>
            )}
            {kartu.length > 0 ? (
              <>
                <hr className="border-tertiary/10" />
                <section aria-labelledby="judul-terkini">
                  <div className="flex justify-between items-end mb-6">
                    <h2 id="judul-terkini" className="font-headline-lg text-headline-lg text-primary">Berita Terkini</h2>
                    <Link className="hidden md:flex items-center gap-1 text-secondary font-label-md text-label-md hover:underline" href="/berita">
                      Lihat Semua Berita
                      <Ikon nama="arrow_forward" className="text-sm" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {kartu.map((a) => <KartuBerita key={a.id} a={a} />)}
                  </div>
                  <div className="mt-8 md:hidden">
                    <Link className="flex items-center justify-center gap-1 text-secondary font-label-md text-label-md hover:underline" href="/berita">
                      Lihat Semua Berita <Ikon nama="arrow_forward" className="text-sm" />
                    </Link>
                  </div>
                </section>
              </>
            ) : null}
          </div>
          <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-8">
            <PalingDibaca palingDibaca={palingDibaca} />
            <WidgetLaporan />
            <StatusAdvokasi kasus={kasus} />
            <RekamJejak statistik={statistik} />
          </aside>
        </div>
      </div>
    </main>
  );
}
