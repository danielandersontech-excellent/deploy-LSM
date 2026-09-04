// app/(publik)/page.js — BERANDA. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari beranda_warkop_nusantara/code.html (830 px).
// Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) gambar -> lokal/DB,
// (c) href="#" -> rute, (d) bagian DINAMIS (statistik, sorotan, status advokasi) -> DB,
// (e) kartu berulang -> .map(), (f) JSX. Navbar/footer dari layout (18.3).
// Aturan 13: Status Advokasi HANYA nomor kasus, kategori, wilayah, status (SQL tanpa identitas).
import Image from 'next/image';
import Link from 'next/link';
import TautanKartu from '@/components/publik/TautanKartu';
import Ikon from '@/components/ui/Ikon';
import Lencana from '@/components/ui/Lencana';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilPengaturan } from '@/lib/db/pengaturan';
import { ambilArtikelSorotan } from '@/lib/db/artikel';
import { ambilKasusBerjalanPublik } from '@/lib/db/pengaduan';
import { labelKategoriPengaduan } from '@/lib/kategoriPengaduan';
import { formatAngkaID, formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: { absolute: 'WARKOP NUSANTARA — Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara' },
  description: 'Lembaga pengawasan sipil independen: kanal pengaduan masyarakat yang melindungi identitas pelapor dan portal berita investigasi. Berani Karena Benar.',
  alternates: { canonical: '/' },
  openGraph: { title: 'WARKOP NUSANTARA', description: 'Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara. Berani Karena Benar.', url: '/' },
};

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
  const [setelan, artikel, kasus] = await Promise.all([
    ambilPengaturan(['statistik_laporan_ditangani', 'statistik_provinsi_tercover', 'statistik_tahun_mengawasi']),
    ambilArtikelSorotan(2),
    ambilKasusBerjalanPublik(2),
  ]);
  const [utama, kedua] = artikel;
  // Angka statistik dari `pengaturan` (bukan dipaku). Label + keterangan verbatim dari code.html.
  const statistik = [
    { angka: `${formatAngkaID(setelan.statistik_laporan_ditangani)}+`, label: 'Laporan Ditangani', keterangan: 'Diselesaikan melalui mediasi dan advokasi hukum yang transparan.', kelas: 'text-center md:text-left md:pr-8 pt-6 md:pt-0' },
    { angka: formatAngkaID(setelan.statistik_provinsi_tercover), label: 'Provinsi Tercover', keterangan: 'Jaringan relawan pengawas yang tersebar di seluruh pelosok negeri.', kelas: 'text-center md:text-left md:px-8 pt-6 md:pt-0' },
    { angka: formatAngkaID(setelan.statistik_tahun_mengawasi), label: 'Tahun Mengawasi', keterangan: 'Konsisten mengawal kebijakan publik sejak didirikan.', kelas: 'text-center md:text-left md:pl-8 pt-6 md:pt-0' },
  ];

  return (
    <main id="konten-utama" className="flex-grow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANISASI) }} />
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-surface-container-lowest">
        {/* Background Map Watermark (Decorative) — KEPUTUSAN BARU: segel logo (memuat peta Nusantara) sebagai watermark lokal */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center" aria-hidden="true">
          <Image className="w-full h-full object-cover" src="/logo-warkop-besar.png" alt="" width={1024} height={1024} priority />
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 border border-secondary-fixed/50 mb-6">
              <Ikon nama="verified_user" terisi className="text-secondary text-sm" />
              <span className="font-label-md text-label-md text-secondary">Pengawasan Sipil Independen</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary mb-4 leading-tight">
              Wadah Aspirasi Rakyat,<br />
              <span className="text-secondary">Kontrol, Observasi dan Pengawasan Nusantara</span>
            </h1>
            <p className="font-motto text-motto text-on-surface-variant text-xl italic mb-8 border-l-4 border-secondary pl-4">
              &quot;Berani Karena Benar.&quot;
            </p>
            <p className="font-body-lg text-body-lg text-on-surface mb-10 max-w-2xl leading-relaxed">
              Kami adalah mata dan telinga rakyat. Lembaga independen yang berdedikasi untuk memastikan transparansi, keadilan, dan akuntabilitas di setiap lapisan pemerintahan dan pelayanan publik di Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/kontak" className="bg-primary text-on-primary hover:bg-primary-container px-8 py-4 rounded-lg font-label-md text-label-md transition-all shadow-[0_4px_14px_0_rgba(39,19,16,0.39)] hover:shadow-[0_6px_20px_rgba(39,19,16,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <Ikon nama="campaign" />
                Sampaikan Pengaduan
              </Link>
              <Link href="/faq" className="bg-surface text-primary border border-outline hover:bg-surface-container-low px-8 py-4 rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2">
                <Ikon nama="menu_book" />
                Pelajari Prosedur
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section — angka dari pengaturan */}
      <section className="bg-primary text-on-primary py-16 border-y border-outline" aria-label="Statistik lembaga">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
            {statistik.map((s) => (
              <div key={s.label} className={s.kelas}>
                <div className="font-headline-xl text-headline-xl text-secondary-fixed mb-2">{s.angka}</div>
                <div className="font-label-md text-label-md text-on-primary-container uppercase tracking-wider">{s.label}</div>
                <p className="font-body-md text-body-md mt-2 text-on-primary/80">{s.keterangan}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Latest News Section (Bento Grid Style) */}
      <section className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Sorotan Investigasi</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Laporan terkini dari lapangan oleh tim pengawas Warkop Nusantara.</p>
            </div>
            <Link className="hidden md:flex items-center gap-1 text-secondary font-label-md text-label-md hover:underline" href="/berita">
              Lihat Semua Berita
              <Ikon nama="arrow_forward" className="text-sm" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Article (Takes up 2 columns on large screens) */}
            {utama ? (
              <article className="lg:col-span-2 group cursor-pointer bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row relative">
                {/* QA-1: seluruh kartu bisa diklik (tautan peregang); judul tetap <Link> untuk keyboard */}
                <TautanKartu href={`/berita/${utama.slug}`} />
                <div className="absolute top-4 left-4 z-20">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error text-on-error font-label-md text-xs shadow-sm">
                    <Ikon nama="warning" terisi className="text-[14px]" />
                    {utama.kategori_nama}
                  </div>
                </div>
                <div className="w-full sm:w-2/5 h-64 sm:h-auto relative overflow-hidden">
                  <div className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" role="img" aria-label={`Gambar utama: ${utama.judul}`} style={{ backgroundImage: `url('${utama.gambar_utama || '/penampung/artikel-1.jpg'}')` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent sm:hidden"></div>
                </div>
                <div className="w-full sm:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-on-surface-variant font-label-md text-xs mb-3">
                      <span className="flex items-center gap-1"><Ikon nama="calendar_today" className="text-[14px]" /> {formatTanggalID(utama.terbit_pada)}</span>
                      {utama.wilayah_nama ? <span className="flex items-center gap-1"><Ikon nama="location_on" className="text-[14px]" /> {utama.wilayah_nama}</span> : null}
                    </div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors line-clamp-2">
                      <Link href={`/berita/${utama.slug}`} className="focus:outline-none focus:underline">{utama.judul}</Link>
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface mb-6 line-clamp-3">{utama.ringkasan}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <Ikon nama="person" className="text-on-surface-variant text-sm" />
                      </div>
                      <span className="font-label-md text-xs text-on-surface-variant">{utama.penulis_nama}</span>
                    </div>
                    <Ikon nama="arrow_forward" className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </div>
              </article>
            ) : (
              <div className="lg:col-span-2">
                <KeadaanKosong ikon="article" judul="Belum ada sorotan investigasi" keterangan="Artikel yang diterbitkan redaksi akan tampil di sini." />
              </div>
            )}
            {/* Article 2 */}
            {kedua ? (
              <article className="group cursor-pointer bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col relative">
                <TautanKartu href={`/berita/${kedua.slug}`} />
                <div className="h-48 relative overflow-hidden border-b border-outline-variant">
                  <div className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700" role="img" aria-label={`Gambar utama: ${kedua.judul}`} style={{ backgroundImage: `url('${kedua.gambar_utama || '/penampung/artikel-2.jpg'}')` }}></div>
                  <div className="absolute top-3 left-3">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-primary font-label-md text-[10px] uppercase border border-outline-variant shadow-sm">
                      {kedua.kategori_nama}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-4 text-on-surface-variant font-label-md text-xs mb-2">
                    <span className="flex items-center gap-1"><Ikon nama="calendar_today" className="text-[14px]" /> {formatTanggalID(kedua.terbit_pada)}</span>
                  </div>
                  <h3 className="font-headline-md text-lg font-semibold text-primary mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                    <Link href={`/berita/${kedua.slug}`} className="focus:outline-none focus:underline">{kedua.judul}</Link>
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface text-sm mb-4 line-clamp-3">{kedua.ringkasan}</p>
                  <Link href={`/berita/${kedua.slug}`} className="mt-auto pt-4 flex items-center justify-between text-secondary font-label-md text-sm" aria-label={`Baca selengkapnya: ${kedua.judul}`}>
                    <span className="">Baca Selengkapnya</span>
                    <Ikon nama="east" className="text-sm" />
                  </Link>
                </div>
              </article>
            ) : null}
            {/* Article 3 — Status Advokasi (aturan 13: tanpa identitas pelapor) */}
            <article className="group cursor-pointer bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col lg:col-start-3">
              <div className="p-6 flex flex-col h-full bg-surface-container-low border-b-4 border-secondary-fixed">
                <div className="flex items-center gap-2 mb-4">
                  <Ikon nama="gavel" className="text-secondary text-3xl" />
                  <h4 className="font-headline-md text-lg text-primary">Status Advokasi</h4>
                </div>
                <div className="space-y-4 flex-grow">
                  {kasus.length === 0 ? (
                    <p className="font-body-md text-sm text-on-surface-variant">Belum ada kasus yang sedang berjalan.</p>
                  ) : (
                    kasus.map((k) => (
                      <div key={k.nomor_kasus} className="border-l-2 border-outline pl-4 py-1">
                        <p className="font-label-md text-xs text-on-surface-variant mb-1">Kasus {k.nomor_kasus} - {labelKategoriPengaduan(k.kategori_masalah)}</p>
                        <p className="font-body-md text-sm font-medium text-primary">{k.wilayah_nama || 'Lingkup nasional'}</p>
                        <Lencana status={k.status} className="mt-2" />
                      </div>
                    ))
                  )}
                </div>
                <Link href="/lacak" className="w-full py-2 mt-4 border border-outline rounded text-primary font-label-md text-sm hover:bg-surface-container transition-colors text-center block">
                  Pantau Semua Kasus
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
