// app/(publik)/struktur/page.js — STRUKTUR ORGANISASI. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari struktur_organisasi/code.html (screen.png 1280 px).
// Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) foto -> next/image dari kolom `foto`,
// (c) href/button -> rute (?wilayah=, ?tampilan=peta, #pengurus-<id>), (d) nama/jabatan/wilayah/
// tahun/deskripsi -> tabel pengurus, (e) kartu Dewan Eksekutif & kartu regional -> .map(),
// (f) JSX. Navbar/footer dari layout (18.3). Bagian "Pimpinan Regional" ber-id="regional"
// karena footer kanonik menautkan ke /struktur#regional.
import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilPengurusAktif } from '@/lib/db/pengurus';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Struktur Organisasi',
  description:
    'Jajaran kepengurusan WARKOP NUSANTARA: Pimpinan Pusat, Dewan Eksekutif, dan Pimpinan Regional yang berdedikasi untuk mewujudkan aspirasi rakyat, kontrol sosial, dan pengawasan yang transparan.',
  alternates: { canonical: '/struktur' },
};

/** Tahun "Aktif sejak": kolom aktif_sejak SMALLINT (mis. 2021); tetap aman bila Date / 'YYYY-MM-DD'. */
function tahunAktif(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return '';
  if (nilai instanceof Date) return formatTanggalID(nilai, 'panjang').slice(-4);
  const cocok = String(nilai).match(/^(\d{4})/);
  return cocok ? cocok[1] : '';
}

export default async function HalamanStruktur({ searchParams }) {
  const sp = await searchParams;
  // Filter wilayah & tampilan tercermin di URL (?wilayah=<id>&tampilan=peta) — bekerja tanpa JavaScript.
  const wilayahDipilih = /^\d+$/.test(String(sp?.wilayah ?? '')) ? Number(sp.wilayah) : null;
  const tampilanPeta = sp?.tampilan === 'peta';

  const semua = await ambilPengurusAktif();
  const pusat = semua.filter((p) => p.tingkat === 'pusat');
  const regional = semua.filter((p) => p.tingkat === 'wilayah');
  const [pimpinanPusat, ...dewanEksekutif] = pusat;
  const regionalTersaring = wilayahDipilih === null ? regional : regional.filter((p) => Number(p.wilayah_id) === wilayahDipilih);
  const namaWilayahDipilih = wilayahDipilih === null ? null : (regional.find((p) => Number(p.wilayah_id) === wilayahDipilih)?.wilayah_nama ?? null);

  // Tautan tombol ikon (KEPUTUSAN BARU): filter_list = kembali ke semua wilayah; map = tampilan peta.
  const hrefSemuaWilayah = tampilanPeta ? '/struktur?tampilan=peta#regional' : '/struktur#regional';
  const hrefPeta = tampilanPeta
    ? (wilayahDipilih === null ? '/struktur#regional' : `/struktur?wilayah=${wilayahDipilih}#regional`)
    : (wilayahDipilih === null ? '/struktur?tampilan=peta#regional' : `/struktur?wilayah=${wilayahDipilih}&tampilan=peta#regional`);
  const hrefWilayah = (id) => (tampilanPeta ? `/struktur?wilayah=${id}&tampilan=peta#regional` : `/struktur?wilayah=${id}#regional`);

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-4">Struktur Organisasi</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Jajaran kepengurusan WARKOP NUSANTARA yang berdedikasi untuk mewujudkan aspirasi rakyat, kontrol sosial, dan pengawasan yang transparan demi keadilan bersama.
        </p>
      </div>
      {/* Hierarchical Section */}
      <section className="mb-24">
        {pimpinanPusat ? (
          <div className="flex flex-col items-center gap-12">
            {/* Chairman */}
            <div id={`pengurus-${pimpinanPusat.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md text-center pressed-paper-shadow relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary-fixed text-on-secondary-fixed px-4 py-1 rounded-full font-label-md text-label-md flex items-center gap-2 border border-outline-variant shadow-sm">
                <Ikon nama="verified_user" className="text-sm" />
                Pimpinan Pusat
              </div>
              <div className="w-32 h-32 mx-auto rounded-full bg-surface-variant mb-4 overflow-hidden border-2 border-secondary-fixed-dim mt-2">
                {pimpinanPusat.foto ? (
                  <Image className="w-full h-full object-cover" src={pimpinanPusat.foto} alt={`Foto ${pimpinanPusat.nama}`} width={600} height={600} sizes="128px" priority />
                ) : null}
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-1">{pimpinanPusat.nama}</h2>
              <p className="font-label-md text-label-md text-secondary mb-2 uppercase tracking-wide">{pimpinanPusat.jabatan}</p>
              <div className="w-12 h-1 bg-outline-variant mx-auto my-3"></div>
              <p className="font-body-md text-body-md text-on-surface-variant">{pimpinanPusat.deskripsi}</p>
            </div>
            {dewanEksekutif.map((p) => (
              // Satu pasangan garis penghubung + kartu per anggota Dewan Eksekutif (kelas dari kartu Sekretaris Jenderal di desain)
              <Fragment key={p.id}>
                <div className="w-px h-12 bg-outline-variant hidden md:block"></div>
                {/* Secretary General */}
                <div id={`pengurus-${p.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md text-center pressed-paper-shadow relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-4 py-1 rounded-full font-label-md text-label-md flex items-center gap-2 border border-outline-variant shadow-sm">
                    <Ikon nama="gavel" className="text-sm" />
                    Dewan Eksekutif
                  </div>
                  <div className="w-24 h-24 mx-auto rounded-full bg-surface-variant mb-4 overflow-hidden border border-outline mt-2">
                    {p.foto ? (
                      <Image className="w-full h-full object-cover" src={p.foto} alt={`Foto ${p.nama}`} width={600} height={600} sizes="96px" />
                    ) : null}
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary text-xl mb-1">{p.nama}</h3>
                  <p className="font-label-md text-label-md text-on-surface-variant mb-2">{p.jabatan}</p>
                </div>
              </Fragment>
            ))}
          </div>
        ) : (
          <KeadaanKosong ikon="verified_user" judul="Data pimpinan pusat belum tersedia" keterangan="Susunan Pimpinan Pusat dan Dewan Eksekutif akan ditampilkan setelah diperbarui oleh pengelola." />
        )}
      </section>
      {/* Regional Chapters */}
      <section id="regional">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant">
          <h2 className="font-headline-lg text-headline-lg text-primary">Pimpinan Regional</h2>
          <div className="flex gap-2">
            <Link
              href={hrefSemuaWilayah}
              className="p-2 bg-surface-container-high rounded border border-outline-variant hover:bg-surface-variant transition-colors"
              aria-label={wilayahDipilih === null ? 'Filter wilayah: menampilkan semua wilayah' : `Hapus filter wilayah ${namaWilayahDipilih ?? ''}`.trim()}
            >
              <Ikon nama="filter_list" />
            </Link>
            <Link
              href={hrefPeta}
              className="p-2 bg-primary text-on-primary rounded hover:bg-primary-container transition-colors"
              aria-label={tampilanPeta ? 'Tutup tampilan peta' : 'Buka tampilan peta'}
            >
              <Ikon nama="map" />
            </Link>
          </div>
        </div>
        {tampilanPeta ? (
          // KEPUTUSAN BARU: tampilan peta tidak digambar Stitch; aset peta tidak ada -> segel logo besar
          // (memuat peta Nusantara) dalam kartu berkelas sama dengan kartu regional, tanpa kelas baru.
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col mb-4">
            <Image className="w-full h-full object-cover" src="/penampung/peta-penampung.jpg" alt="Peta jangkauan WARKOP NUSANTARA di seluruh Nusantara" width={1200} height={800} />
          </div>
        ) : null}
        {regionalTersaring.length === 0 ? (
          <KeadaanKosong
            ikon="location_on"
            judul={wilayahDipilih === null ? 'Belum ada pimpinan regional' : 'Tidak ada pimpinan regional untuk wilayah ini'}
            keterangan={wilayahDipilih === null ? 'Daftar kepala regional akan ditampilkan setelah diperbarui oleh pengelola.' : 'Coba tampilkan semua wilayah.'}
          >
            {wilayahDipilih !== null ? (
              <Link href={hrefSemuaWilayah} className="text-secondary hover:text-primary transition-colors flex items-center gap-1 font-label-md text-label-md text-sm">
                Tampilkan semua wilayah <Ikon nama="arrow_forward" className="text-[16px]" />
              </Link>
            ) : null}
          </KeadaanKosong>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {regionalTersaring.map((p) => (
              // Kartu regional: kelas dari kartu pertama (North Sumatra) di desain
              <div key={p.id} id={`pengurus-${p.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-surface-variant -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-16 h-16 rounded bg-surface-variant overflow-hidden shrink-0 border border-outline-variant">
                    {p.foto ? (
                      <Image className="w-full h-full object-cover" src={p.foto} alt={`Foto ${p.nama}`} width={600} height={600} sizes="64px" />
                    ) : null}
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-primary text-base font-bold">{p.nama}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm">{p.jabatan}</p>
                    {p.wilayah_id ? (
                      // Lencana wilayah = tautan filter ?wilayah=<id> (div -> Link, kelas sama)
                      <Link href={hrefWilayah(p.wilayah_id)} className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-xs mt-1 border border-outline-variant" aria-label={`Tampilkan pimpinan regional wilayah ${p.wilayah_nama ?? ''}`.trim()}>
                        <Ikon nama="location_on" className="text-[14px]" />
                        {p.wilayah_nama}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center relative z-10">
                  <span className="font-body-md text-body-md text-xs text-on-surface-variant">{tahunAktif(p.aktif_sejak) ? `Aktif sejak ${tahunAktif(p.aktif_sejak)}` : ''}</span>
                  <Link href={`/struktur#pengurus-${p.id}`} className="text-secondary hover:text-primary transition-colors flex items-center gap-1 font-label-md text-label-md text-sm" aria-label={`Profil ${p.nama}`}>
                    Profil <Ikon nama="arrow_forward" className="text-[16px]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
