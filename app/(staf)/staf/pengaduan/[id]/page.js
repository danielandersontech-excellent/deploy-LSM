// app/(staf)/staf/pengaduan/[id]/page.js — Detail Pengaduan (staf). Server component.
// Layar ini TIDAK ada di ZIP (TAHAP-06 §6) -> REFERENSI 18.4, KEPUTUSAN BARU dengan cetakan:
//   - kerangka halaman staf (pembungkus p-margin-desktop, <header> judul, kartu putih
//     bg-surface-container-lowest border … rounded-lg) dari kelola_artikel_admin/code.html;
//   - kartu "Hubungi Kami" (baris ikon kotak bg-surface-container-high) untuk RINGKASAN KASUS,
//     kartu "Kerahasiaan Dijamin" (bg-secondary-fixed/20, emas muda, ikon security terisi) untuk
//     PANEL IDENTITAS (DATA SENSITIF), butir daftar berkas untuk LAMPIRAN, lingkaran bernomor
//     indikator langkah untuk LINIMASA — semuanya dari kontak_pengaduan_warkop_nusantara_updated_logo/code.html;
//   - formulir ubah status/penugasan (PanelStatusPengaduan) dari kartu formulir layar itu.
// Sidebar + <main> dirender layout staf; halaman ini hanya mengembalikan ISI <main>.
//
// PERLINDUNGAN IDENTITAS (aturan 3, TAHAP-06 §8) — ditegakkan berlapis di sini:
//   - kolom identitas hanya di-SELECT bila bolehLihatIdentitas(peran) (SQL, bukan JS);
//   - panel identitas hanya dirender bila kolomnya ada; peran lain tidak menerima nilainya sama sekali
//     (tidak di HTML, tidak di muatan RSC — props ke client component hanya id/status/petugas/kandidat);
//   - setiap pembukaan identitas (peran berhak & pengaduan tidak anonim) dicatat di audit_log;
//   - pimpinan_wilayah: pengaduan di luar wilayahnya -> notFound() (keberadaan tidak bocor), baca-saja.
// PRATINJAU AMAN LAMPIRAN: berkas pengguna tidak pernah dirender langsung ke DOM. Gambar hanya lewat
// <img src="/api/staf/pengaduan/<id>/lampiran/<lid>"> (route terjaga: nosniff + CSP sandbox + inline
// khusus gambar); PDF/MP4 = tautan unduh; tidak ada <iframe>/<object>/<video>. Deskripsi = teks polos.
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import Lencana from '@/components/ui/Lencana';
import PanelStatusPengaduan from '@/components/staf/PanelStatusPengaduan';
import { ambilPenggunaSesi, alamatIpPermintaan } from '@/lib/auth/sesi';
import { HAK, bolehLihatIdentitas, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilPengaduan, ambilRiwayat, ambilLampiran } from '@/lib/db/pengaduan';
import { ambilPetugasKandidat } from '@/lib/db/users';
import { catatAudit } from '@/lib/db/audit';
import { labelKategoriPengaduan, labelStatusPengaduan } from '@/lib/kategoriPengaduan';
import { formatTanggalID } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Kelas VERBATIM cetakan (kontak_pengaduan_…): kartu, judul kartu, baris ikon, label/nilai, judul seksi.
const KELAS_KARTU = 'bg-surface-container-lowest border border-tertiary p-6 rounded-lg pressed-paper-shadow';
const KELAS_JUDUL_KARTU = 'font-headline-md text-headline-md text-primary mb-6 flex items-center gap-2 border-b border-outline-variant pb-3';
const KELAS_JUDUL_SEKSI = 'font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant';
const KELAS_LABEL = 'font-label-md text-label-md text-primary mb-1';
const KELAS_NILAI = 'font-body-md text-body-md text-on-surface-variant';
// Lingkaran bernomor indikator langkah: aktif (emas) untuk langkah terakhir, abu untuk yang lain.
const KELAS_LINGKARAN_AKTIF = 'w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm';
const KELAS_LINGKARAN = 'w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-sm';

function idDari(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Ukuran berkas dalam KB/MB dengan koma desimal Indonesia. */
function formatUkuran(byte) {
  const n = Number(byte) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** Jenis lampiran untuk label & ikon. Ikon: image (gambar), article (PDF), play_arrow (video) — KEPUTUSAN BARU. */
function jenisLampiran(tipeMime) {
  const mime = String(tipeMime || '');
  if (mime.startsWith('image/')) return { label: 'Gambar', ikon: 'image', gambar: true };
  if (mime === 'application/pdf') return { label: 'Dokumen PDF', ikon: 'article', gambar: false };
  if (mime.startsWith('video/')) return { label: 'Video', ikon: 'play_arrow', gambar: false };
  return { label: 'Berkas', ikon: 'article', gambar: false };
}

async function muatPengaduanUntuk(pengguna, n) {
  return ambilPengaduan(n, { bolehLihatIdentitas: bolehLihatIdentitas(pengguna.peran), wilayahId: wilayahTerbatas(pengguna) });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const n = idDari(id);
  const pengguna = await ambilPenggunaSesi();
  if (!n || !pengguna || !HAK.pengaduan_lihat.includes(pengguna.peran)) return { title: 'Detail Pengaduan' };
  // Judul hanya memuat nomor kasus (bukan identitas); pembatasan wilayah ikut agar keberadaan tidak bocor.
  const p = await ambilPengaduan(n, { bolehLihatIdentitas: false, wilayahId: wilayahTerbatas(pengguna) });
  return { title: p ? `Pengaduan ${p.nomor_kasus}` : 'Detail Pengaduan' };
}

function BarisRingkasan({ ikon, label, children }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-surface-container-high p-2 rounded text-primary">
        <Ikon nama={ikon} />
      </div>
      <div>
        <p className={KELAS_LABEL}>{label}</p>
        <div className={KELAS_NILAI}>{children}</div>
      </div>
    </div>
  );
}

/** Panel identitas pelapor — HANYA dipanggil bila kolom identitas ada di balasan (peran berhak). */
function PanelIdentitas({ pengaduan }) {
  if (pengaduan.anonim) {
    return (
      <section aria-labelledby="judul-identitas" className="bg-secondary-fixed/20 border border-secondary-fixed p-4 rounded-lg flex items-center gap-4">
        <div className="bg-secondary text-on-secondary p-3 rounded-full flex-shrink-0">
          <Ikon nama="visibility_off" terisi className="text-[28px]" />
        </div>
        <div>
          <h4 id="judul-identitas" className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Laporan anonim, identitas tidak disimpan</h4>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm">Pelapor memilih merahasiakan identitas. Tidak ada nama, NIK, telepon, maupun email yang tersimpan di sistem.</p>
        </div>
      </section>
    );
  }
  const bidang = [
    { label: 'Nama Lengkap (Sesuai KTP)', nilai: pengaduan.nama_pelapor },
    { label: 'Nomor Induk Kependudukan (NIK)', nilai: pengaduan.nik_pelapor },
    { label: 'Nomor Telepon / WhatsApp', nilai: pengaduan.telepon_pelapor },
    { label: 'Alamat Email', nilai: pengaduan.email_pelapor },
  ];
  return (
    <section aria-labelledby="judul-identitas" className="bg-secondary-fixed/20 border border-secondary-fixed p-4 rounded-lg flex items-start gap-4">
      <div className="bg-secondary text-on-secondary p-3 rounded-full flex-shrink-0">
        <Ikon nama="security" terisi className="text-[28px]" />
      </div>
      <div>
        <h4 id="judul-identitas" className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">DATA SENSITIF, Identitas Pelapor</h4>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm">Hanya terlihat oleh superadmin dan verifikator. Pembukaan panel ini tercatat di jejak audit. Jangan disalin ke luar sistem.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bidang.map((b) => (
            <div key={b.label}>
              <p className={KELAS_LABEL}>{b.label}</p>
              <p className="font-body-md text-body-md text-on-surface">{b.nilai || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HalamanDetailPengaduan({ params }) {
  const { id } = await params;
  const n = idDari(id);
  if (!n) notFound();

  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect(`/login?lanjut=${encodeURIComponent(`/staf/pengaduan/${n}`)}`);
  if (!HAK.pengaduan_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const lihatIdentitas = bolehLihatIdentitas(pengguna.peran);
  const bolehUbah = HAK.pengaduan_ubah_status.includes(pengguna.peran); // pimpinan_wilayah -> baca-saja

  const pengaduan = await muatPengaduanUntuk(pengguna, n);
  if (!pengaduan) notFound();

  const [riwayat, lampiran, kandidat] = await Promise.all([
    ambilRiwayat(n),
    ambilLampiran(n),
    bolehUbah ? ambilPetugasKandidat() : Promise.resolve([]),
  ]);

  // Audit: identitas terbuka hanya bila peran berhak DAN pengaduan tidak anonim.
  if (lihatIdentitas && !pengaduan.anonim) {
    await catatAudit({ userId: pengguna.id, aksi: 'lihat_identitas_pelapor', tabelTerkait: 'pengaduan', idTerkait: n, ip: await alamatIpPermintaan() });
  }

  const kategori = labelKategoriPengaduan(pengaduan.kategori_masalah);

  return (
    // KEPUTUSAN BARU: <main class="flex-1 ml-64 p-margin-desktop min-h-screen"> desain sudah digantikan
    // <main> layout staf; padding p-margin-desktop dibawa pembungkus ini (preseden /staf/artikel).
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section — kelas verbatim kelola_artikel_admin */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">{pengaduan.nomor_kasus}</h2>
            <p className="text-on-surface-variant mt-2">
              Detail pengaduan masyarakat · <Lencana status={pengaduan.status} />
            </p>
          </div>
          {/* Tombol kembali: kelas tombol garis "Simpan Draft" kontak_pengaduan (18.2c: tombol -> Link) */}
          <Link href="/staf/pengaduan" className="px-6 py-2 rounded-lg font-label-md text-label-md text-primary border border-outline hover:bg-surface-container-high transition-colors">
            Kembali ke Kelola Pengaduan
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Kolom kiri: ringkasan kasus + identitas (bila berhak) */}
          <div className="lg:col-span-4 space-y-6">
            <section aria-labelledby="judul-ringkasan" className={`${KELAS_KARTU} relative overflow-hidden group`}>
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ikon nama="gavel" className="text-[120px]" />
              </div>
              <h2 id="judul-ringkasan" className={KELAS_JUDUL_KARTU}>
                <Ikon nama="gavel" />
                Ringkasan Kasus
              </h2>
              <div className="space-y-4">
                <BarisRingkasan ikon="sell" label="Kategori Masalah">{kategori}</BarisRingkasan>
                <BarisRingkasan ikon="map" label="Wilayah">{pengaduan.wilayah_nama || 'Tidak disebutkan'}</BarisRingkasan>
                <BarisRingkasan ikon="location_on" label="Lokasi Kejadian">{pengaduan.lokasi_kejadian || 'Tidak disebutkan'}</BarisRingkasan>
                <BarisRingkasan ikon="calendar_today" label="Tanggal Masuk">{formatTanggalID(pengaduan.dibuat_pada, 'lengkap')}</BarisRingkasan>
                <BarisRingkasan ikon="update" label="Terakhir Diperbarui">{formatTanggalID(pengaduan.diperbarui_pada, 'lengkap')}</BarisRingkasan>
                <BarisRingkasan ikon="person" label="Petugas Penanggung Jawab">{pengaduan.petugas_nama || 'Belum ditugaskan'}</BarisRingkasan>
                <BarisRingkasan ikon="pending" label="Status Terkini"><Lencana status={pengaduan.status} /></BarisRingkasan>
              </div>
            </section>

            {/* Panel identitas: TIDAK dirender sama sekali untuk peran tanpa hak (kolomnya pun tidak di-SELECT). */}
            {lihatIdentitas ? <PanelIdentitas pengaduan={pengaduan} /> : null}

            {bolehUbah ? (
              <PanelStatusPengaduan
                id={n}
                statusSaatIni={pengaduan.status}
                petugasSaatIni={pengaduan.petugas_id ?? null}
                kandidat={kandidat.map((k) => ({ id: k.id, nama: k.nama, peran: k.peran }))}
              />
            ) : null}
          </div>

          {/* Kolom kanan: deskripsi, lampiran, linimasa */}
          <div className="lg:col-span-8 space-y-6">
            <section aria-labelledby="judul-deskripsi" className={`${KELAS_KARTU} space-y-5`}>
              <h3 id="judul-deskripsi" className={KELAS_JUDUL_SEKSI}>
                Deskripsi Lengkap Kejadian
              </h3>
              {/* Teks polos dari DB (bukan HTML); whitespace-pre-line menjaga baris baru pelapor — KEPUTUSAN BARU */}
              <p className="font-body-md text-body-md text-on-surface whitespace-pre-line">{pengaduan.deskripsi}</p>
            </section>

            <section aria-labelledby="judul-lampiran" className={`${KELAS_KARTU} space-y-5`}>
              <h3 id="judul-lampiran" className={KELAS_JUDUL_SEKSI}>
                Bukti Pendukung
              </h3>
              {lampiran.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Tidak ada lampiran pada pengaduan ini.</p>
              ) : (
                <div className="space-y-2">
                  {lampiran.map((l, i) => {
                    const jenis = jenisLampiran(l.tipe_mime);
                    const url = `/api/staf/pengaduan/${n}/lampiran/${l.id}`;
                    return (
                      <div key={l.id} className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded border border-outline-variant">
                          <div className="flex items-center gap-3">
                            <Ikon nama={jenis.ikon} className="text-on-surface-variant" />
                            <span className="font-body-md text-body-md text-sm text-on-surface">
                              {l.nama_berkas} · {jenis.label} · {formatUkuran(l.ukuran)}
                            </span>
                          </div>
                          {/* Unduh lewat route terjaga (Content-Disposition attachment untuk non-gambar) */}
                          <a href={url} download={l.nama_berkas} className="text-outline hover:text-primary transition-colors" title="Unduh" aria-label={`Unduh lampiran ${i + 1}: ${l.nama_berkas}`}>
                            <Ikon nama="cloud_upload" className="text-xl" />
                          </a>
                        </div>
                        {jenis.gambar ? (
                          <div className="w-full h-48 bg-surface-variant rounded flex items-center justify-center text-on-surface-variant relative overflow-hidden group">
                            {/* Pratinjau aman: <img> biasa ke route terjaga (nosniff + CSP sandbox), bukan next/image
                                (pengoptimal akan mengambil URL tanpa cookie sesi dan memecah pagar peran). */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Lampiran ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section aria-labelledby="judul-riwayat" className={`${KELAS_KARTU} space-y-5`}>
              <h3 id="judul-riwayat" className={KELAS_JUDUL_SEKSI}>
                Linimasa Riwayat Status
              </h3>
              {riwayat.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">Belum ada riwayat perubahan status.</p>
              ) : (
                <ol className="space-y-4">
                  {riwayat.map((r, i) => (
                    <li key={r.id} className="flex items-start gap-4">
                      <div className={i === riwayat.length - 1 ? KELAS_LINGKARAN_AKTIF : KELAS_LINGKARAN} aria-hidden="true">{i + 1}</div>
                      <div>
                        <p className={`${KELAS_LABEL} flex items-center gap-2`}>
                          {r.status_sebelum ? <Lencana status={r.status_sebelum} /> : <span>Laporan masuk</span>}
                          <Ikon nama="east" className="text-sm" />
                          <Lencana status={r.status_sesudah}>{labelStatusPengaduan(r.status_sesudah)}</Lencana>
                        </p>
                        {r.catatan ? <p className="font-body-md text-body-md text-on-surface whitespace-pre-line">{r.catatan}</p> : null}
                        <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                          {formatTanggalID(r.dibuat_pada, 'lengkap')} · oleh {r.oleh_nama || 'Sistem'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
