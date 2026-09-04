// app/(publik)/struktur/page.js — STRUKTUR ORGANISASI. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin dari struktur_organisasi/code.html (kartu Pimpinan Pusat, kartu Dewan Eksekutif, kartu
// regional, garis penghubung, tombol filter/peta). Enam perubahan 18.2: (a) ikon -> <Ikon>, (b) foto -> next/image dari
// kolom `foto`, (c) href/button -> rute (?wilayah=, ?tampilan=peta, #pengurus-<id>), (d) data -> tabel pengurus,
// (e) kartu -> .map(), (f) JSX. Navbar/footer dari layout (18.3). Bagian "Pimpinan Regional" ber-id="regional".
//
// RUN QA-2 A2/B5 (KEPUTUSAN PEMILIK): bagan BERTINGKAT susunan DPP asli pemilik, dikelompokkan lewat kolom
// pengurus.kelompok (lib/kelompokPengurus.js):
//   Dewan (Pembina | Penasehat | Pengawas) -> Pengurus DPP (Ketua Umum = kartu Pimpinan Pusat desain; lainnya kartu
//   Dewan Eksekutif) -> Direktorat Eksekutif -> Direktorat (grid kartu regional desain) -> Satgas -> kerangka DPW/DPD/DPC
//   (template posisi tanpa nama) -> Pimpinan Regional (pengurus tingkat wilayah ber-wilayah, filter & peta tetap).
// Posisi kosong bernama '(Belum terisi)' ditampilkan redup. Responsif: kolom 1 (375) / 2 (768) / 3 (1280).
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilPengurusAktif } from '@/lib/db/pengurus';
import { formatTanggalID } from '@/lib/utils';
import { KELOMPOK_PENGURUS, belumTerisi } from '@/lib/kelompokPengurus';

export const metadata = {
  title: 'Struktur Organisasi',
  description:
    'Jajaran kepengurusan WARKOP NUSANTARA: Dewan Pembina, Penasehat, dan Pengawas, Pengurus DPP, Direktorat, Satgas, serta kerangka DPW/DPD/DPC dan Pimpinan Regional.',
  alternates: { canonical: '/struktur' },
};

/** Tahun "Aktif sejak": kolom aktif_sejak SMALLINT (mis. 2021); tetap aman bila Date / 'YYYY-MM-DD'. */
function tahunAktif(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return '';
  if (nilai instanceof Date) return formatTanggalID(nilai, 'panjang').slice(-4);
  const cocok = String(nilai).match(/^(\d{4})/);
  return cocok ? cocok[1] : '';
}

// Kelas verbatim desain (struktur_organisasi/code.html)
const KELAS_KARTU_PUSAT = 'bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md text-center pressed-paper-shadow relative';
const KELAS_LENCANA_PUSAT = 'absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary-fixed text-on-secondary-fixed px-4 py-1 rounded-full font-label-md text-label-md flex items-center gap-2 whitespace-nowrap';
const KELAS_LENCANA_ABU = 'absolute -top-4 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-4 py-1 rounded-full font-label-md text-label-md flex items-center gap-2 whitespace-nowrap';
const KELAS_KARTU_KECIL = 'bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group';
const KELAS_GARIS = 'w-px h-12 bg-outline-variant hidden md:block';

/** Foto bulat; posisi kosong tampil redup tanpa foto. */
function Foto({ p, kelasKotak, ukuran }) {
  const kosong = belumTerisi(p.nama);
  return (
    <div className={`${kelasKotak}${kosong ? ' opacity-50' : ''}`}>
      {p.foto && !kosong ? <Image className="w-full h-full object-cover" src={p.foto} alt={`Foto ${p.nama}`} width={600} height={600} sizes={ukuran} /> : null}
    </div>
  );
}

/** Kartu kecil (kelas kartu regional desain) untuk Dewan, Direktorat, Satgas, kerangka. */
function KartuAnggota({ p }) {
  const kosong = belumTerisi(p.nama);
  return (
    <div id={`pengurus-${p.id}`} className={`${KELAS_KARTU_KECIL}${kosong ? ' opacity-70' : ''}`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-surface-variant -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="flex items-start gap-4 relative z-10">
        <Foto p={p} kelasKotak="w-16 h-16 rounded bg-surface-variant overflow-hidden shrink-0 border border-outline-variant" ukuran="64px" />
        <div className="min-w-0">
          <h4 className={`font-label-md text-label-md text-base font-bold ${kosong ? 'text-on-surface-variant italic' : 'text-primary'}`}>{p.nama}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm">{p.jabatan}</p>
          {p.wilayah_nama ? (
            <span className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-xs mt-1 border border-outline-variant text-on-surface-variant font-label-md">
              <Ikon nama="location_on" className="text-[14px]" />
              {p.wilayah_nama}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Kartu sedang (kelas kartu Dewan Eksekutif desain) untuk Pengurus DPP & Direktorat Eksekutif. */
function KartuPengurus({ p, lencana, ikon }) {
  const kosong = belumTerisi(p.nama);
  return (
    <div id={`pengurus-${p.id}`} className={`${KELAS_KARTU_PUSAT}${kosong ? ' opacity-70' : ''}`}>
      <div className={KELAS_LENCANA_ABU}>
        <Ikon nama={ikon} className="text-sm" />
        {lencana}
      </div>
      <Foto p={p} kelasKotak="w-24 h-24 mx-auto rounded-full bg-surface-variant mb-4 overflow-hidden border border-outline mt-2" ukuran="96px" />
      <h3 className={`font-headline-md text-headline-md text-xl mb-1 ${kosong ? 'text-on-surface-variant italic' : 'text-primary'}`}>{p.nama}</h3>
      <p className="font-label-md text-label-md text-on-surface-variant mb-2">{p.jabatan}</p>
    </div>
  );
}

function JudulTahap({ children, keterangan }) {
  return (
    <div className="text-center mb-8">
      <h2 className="font-headline-lg text-headline-lg text-primary">{children}</h2>
      {keterangan ? <p className="font-body-md text-body-md text-on-surface-variant mt-1">{keterangan}</p> : null}
    </div>
  );
}

export default async function HalamanStruktur({ searchParams }) {
  const sp = await searchParams;
  // Filter wilayah & tampilan tercermin di URL (?wilayah=<id>&tampilan=peta), bekerja tanpa JavaScript.
  const wilayahDipilih = /^\d+$/.test(String(sp?.wilayah ?? '')) ? Number(sp.wilayah) : null;
  const tampilanPeta = sp?.tampilan === 'peta';

  const semua = await ambilPengurusAktif();
  const perKelompok = (slug) => semua.filter((p) => p.kelompok === slug);
  const dewan = KELOMPOK_PENGURUS.filter((k) => k.tahap === 'dewan');
  const dpp = perKelompok('pengurus_dpp');
  const ketuaUmum = dpp.find((p) => /ketua umum/i.test(p.jabatan) && !/wakil/i.test(p.jabatan)) || dpp[0] || null;
  const dppLain = dpp.filter((p) => p !== ketuaUmum);
  const direktoratEksekutif = perKelompok('direktorat_eksekutif');
  const direktorat = perKelompok('direktorat');
  const satgas = perKelompok('satgas');
  const kerangka = KELOMPOK_PENGURUS.filter((k) => k.tahap === 'kerangka');
  // Pimpinan Regional = tingkat wilayah (bukan template DPW/DPD/DPC) DAN pengurus mana pun tanpa kelompok.
  // QA-2 C4 (BUG DIPERBAIKI): sebelumnya hanya tingkat 'wilayah', sehingga pengurus tingkat 'pusat' yang ditambahkan
  // lewat Kelola Pengurus dengan pilihan "Tanpa kelompok (Pimpinan Regional)" tersimpan tetapi TIDAK PERNAH tampil
  // di halaman publik mana pun (melanggar K3 dan menyalahi label pilihannya sendiri).
  const regional = semua.filter((p) => !/^dp[wdc]$/.test(p.kelompok || '') && (p.tingkat === 'wilayah' || !p.kelompok));
  const regionalTersaring = wilayahDipilih === null ? regional : regional.filter((p) => Number(p.wilayah_id) === wilayahDipilih);
  const namaWilayahDipilih = wilayahDipilih === null ? null : (regional.find((p) => Number(p.wilayah_id) === wilayahDipilih)?.wilayah_nama ?? null);
  const adaBagan = semua.some((p) => p.kelompok);

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

      {!adaBagan ? (
        <section className="mb-24">
          <KeadaanKosong ikon="verified_user" judul="Susunan kepengurusan belum tersedia" keterangan="Bagan Dewan, Pengurus DPP, Direktorat, dan Satgas akan ditampilkan setelah diperbarui oleh pengelola." />
        </section>
      ) : (
        <>
          {/* Tahap 1: Dewan Pembina | Penasehat | Pengawas */}
          <section className="mb-16" aria-labelledby="judul-dewan">
            <JudulTahap keterangan="Dewan Pembina, Dewan Penasehat, dan Dewan Pengawas Dewan Pimpinan Pusat">
              <span id="judul-dewan">Dewan Pimpinan Pusat</span>
            </JudulTahap>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {dewan.map((k) => (
                <div key={k.slug} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 md:p-5">
                  <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Ikon nama={k.ikon} className="text-sm" />
                    {k.label}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {perKelompok(k.slug).map((p) => <KartuAnggota key={p.id} p={p} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tahap 2: Pengurus DPP */}
          <section className="mb-16" aria-labelledby="judul-dpp">
            <JudulTahap keterangan="Ketua Umum, Wakil Ketua Umum, Sekretaris Jenderal, Bendahara Umum">
              <span id="judul-dpp">Pengurus DPP</span>
            </JudulTahap>
            <div className="flex flex-col items-center gap-12">
              {ketuaUmum ? (
                <div id={`pengurus-${ketuaUmum.id}`} className={KELAS_KARTU_PUSAT}>
                  <div className={KELAS_LENCANA_PUSAT}>
                    <Ikon nama="verified_user" className="text-sm" />
                    Pimpinan Pusat
                  </div>
                  <Foto p={ketuaUmum} kelasKotak="w-32 h-32 mx-auto rounded-full bg-surface-variant mb-4 overflow-hidden border-2 border-secondary-fixed-dim mt-2" ukuran="128px" />
                  <h2 className="font-headline-md text-headline-md text-primary mb-1">{ketuaUmum.nama}</h2>
                  <p className="font-label-md text-label-md text-secondary mb-2 uppercase tracking-wide">{ketuaUmum.jabatan}</p>
                  <div className="w-12 h-1 bg-outline-variant mx-auto my-3"></div>
                  <p className="font-body-md text-body-md text-on-surface-variant">{ketuaUmum.deskripsi || 'Memimpin dan mengarahkan seluruh visi serta misi pengawasan nasional.'}</p>
                </div>
              ) : null}
              {dppLain.length ? (
                <>
                  <div className={KELAS_GARIS}></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full justify-items-center">
                    {dppLain.map((p) => <KartuPengurus key={p.id} p={p} lencana="Pengurus DPP" ikon="gavel" />)}
                  </div>
                </>
              ) : null}
            </div>
          </section>

          {/* Tahap 3: Direktorat Eksekutif + Direktorat */}
          <section className="mb-16" aria-labelledby="judul-direktorat">
            <JudulTahap keterangan="Direktur dan Wakil Direktur Eksekutif membawahi sembilan direktorat bidang">
              <span id="judul-direktorat">Direktorat</span>
            </JudulTahap>
            <div className="flex flex-col items-center gap-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full max-w-3xl justify-items-center">
                {direktoratEksekutif.map((p) => <KartuPengurus key={p.id} p={p} lencana="Direktorat Eksekutif" ikon="gavel" />)}
              </div>
              <div className={KELAS_GARIS}></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter w-full">
                {direktorat.map((p) => <KartuAnggota key={p.id} p={p} />)}
              </div>
            </div>
          </section>

          {/* Tahap 4: Satgas */}
          <section className="mb-16" aria-labelledby="judul-satgas">
            <JudulTahap keterangan="Kepala Satgas, Wakil, Komandan Wilayah/Daerah/Rayon, dan Anggota">
              <span id="judul-satgas">Satuan Tugas (Satgas)</span>
            </JudulTahap>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {satgas.map((p) => <KartuAnggota key={p.id} p={p} />)}
            </div>
          </section>

          {/* Tahap 5: Kerangka DPW / DPD / DPC */}
          <section className="mb-24" aria-labelledby="judul-kerangka">
            <JudulTahap keterangan="Kerangka posisi kepengurusan wilayah, daerah, dan cabang; diisi bertahap oleh pengelola">
              <span id="judul-kerangka">Kerangka DPW, DPD, dan DPC</span>
            </JudulTahap>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {kerangka.map((k) => (
                <div key={k.slug} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 md:p-5">
                  <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Ikon nama={k.ikon} className="text-sm" />
                    {k.label}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {perKelompok(k.slug).map((p) => <KartuAnggota key={p.id} p={p} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Regional Chapters (desain) */}
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
          // KEPUTUSAN BARU: tampilan peta tidak digambar Stitch; aset peta tidak ada -> penampung peta dalam kartu berkelas sama.
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col mb-4">
            <Image className="w-full h-full object-cover" src="/penampung/peta-penampung.jpg" alt="Peta jangkauan WARKOP NUSANTARA di seluruh Nusantara" width={1200} height={800} />
          </div>
        ) : null}
        {regionalTersaring.length === 0 ? (
          <KeadaanKosong
            ikon="location_on"
            judul={wilayahDipilih === null ? 'Belum ada pimpinan regional' : 'Tidak ada pimpinan regional untuk wilayah ini'}
            keterangan={wilayahDipilih === null ? 'Daftar pimpinan wilayah akan ditampilkan setelah diperbarui oleh pengelola lewat Kelola Pengurus.' : 'Coba tampilkan semua wilayah.'}
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
              <div key={p.id} id={`pengurus-${p.id}`} className={KELAS_KARTU_KECIL}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-surface-variant -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <Foto p={p} kelasKotak="w-16 h-16 rounded bg-surface-variant overflow-hidden shrink-0 border border-outline-variant" ukuran="64px" />
                  <div>
                    <h4 className="font-label-md text-label-md text-primary text-base font-bold">{p.nama}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm">{p.jabatan}</p>
                    {p.wilayah_id ? (
                      // Lencana wilayah = tautan filter ?wilayah=<id> (div -> Link, kelas sama)
                      <Link href={hrefWilayah(p.wilayah_id)} className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-xs mt-1 border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-variant transition-colors">
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
