// app/(staf)/staf/dashboard/page.js — Dashboard staf. Port DOM 1:1 dari
// desain/stitch_portal_berita_inklusif/dashboard_staff_warkop/code.html (REFERENSI 18.2).
// Sidebar <nav> dan <main class="flex-1 ml-64 h-full overflow-y-auto"> dirender layout staf
// (sidebar kanonik 18.3); halaman ini hanya mengembalikan ISI <main> desain: <header> + <div p-margin-desktop>.
// Server component: seluruh angka dari lib/db/statistik.js + lib/db/audit.js (tidak ada yang dipaku),
// pembatasan wilayah pimpinan_wilayah lewat wilayahTerbatas() -> WHERE di SQL.
//
// PENYESUAIAN PER PERAN (TAHAP-07 §2 "rapi, bukan tumpukan kondisi") — KEPUTUSAN BARU:
// satu peta konfigurasi TAMPILAN_PERAN memilih (1) isi panel samping dan (2) tabel bawah:
//   superadmin       : panel "Aktivitas Staf" (audit_log)        + tabel Pengaduan Terbaru
//   verifikator      : panel "Menunggu Verifikasi" (status baru) + tabel Pengaduan Terbaru
//   pimpinan_wilayah : panel "Artikel Terbaru" (wilayahnya)      + tabel Pengaduan Terbaru (wilayahnya)
//   redaktur         : panel "Draf Menunggu Terbit"              + tabel Artikel Terbaru
//   penulis          : panel "Draf Saya"                         + tabel Artikel Terbaru (miliknya)
// Panel dan tabel memakai markup + kelas desain yang SAMA; hanya judul, ikon, dan datanya yang berubah.
// Peran tanpa hak pengaduan_lihat (redaktur/penulis) tidak pernah menerima baris pengaduan.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import Lencana from '@/components/ui/Lencana';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { hitungStatistikDashboard, trenLaporanBulanan, pengaduanTerbaru, artikelTerbaruDashboard } from '@/lib/db/statistik';
import { ambilAktivitasTerbaru } from '@/lib/db/audit';
import { daftarPengaduan } from '@/lib/db/pengaduan';
import { ambilArtikelStaf } from '@/lib/db/artikel';
import { labelKategoriPengaduan } from '@/lib/kategoriPengaduan';
import { formatTanggalID, formatAngkaID } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard',
  description: 'Status pelaporan dan operasional hari ini.',
};
export const dynamic = 'force-dynamic';

const BULAN_TREN = 12;
const BATAS_PANEL = 6;
const BATAS_TABEL = 5;
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// ---------------------------------------------------------------------------------------------
// Kelas VERBATIM desain yang dipakai berulang (elemen pertama tiap kelompok, 18.2e)
// ---------------------------------------------------------------------------------------------
// Lingkaran ikon butir aktivitas: butir ke-1/3 (abu) dan butir ke-2 (emas, untuk aksi pengaduan).
const KELAS_LINGKARAN_ABU = 'w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0';
const KELAS_LINGKARAN_EMAS = 'w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0';
// Baris tabel: kelas baris PERTAMA desain dipakai untuk semua baris (zebra baris ke-2
// `bg-surface-container-low hover:bg-surface-container` tidak disalin — KEPUTUSAN BARU, 18.2e).
const KELAS_BARIS = 'bg-surface-lowest hover:bg-surface-container-low transition-colors';
const KELAS_TOMBOL_LIHAT = 'p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded';
const KELAS_TOMBOL_PROSES = 'p-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded';
// Chip status di tabel desain (untuk status ARTIKEL — KEPUTUSAN BARU: chip "Baru" emas = terbit,
// chip "Diproses" abu = draf/arsip; status PENGADUAN memakai <Lencana> kanonik REFERENSI 10).
const CHIP_ARTIKEL = Object.freeze({
  terbit: { label: 'Published', kelas: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-xs font-semibold border border-secondary-fixed-dim', titik: 'w-1.5 h-1.5 rounded-full bg-on-secondary-fixed-variant' },
  draf: { label: 'Draft', kelas: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-xs font-semibold border border-outline-variant', titik: 'w-1.5 h-1.5 rounded-full bg-outline' },
  arsip: { label: 'Arsip', kelas: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-xs font-semibold border border-outline-variant', titik: 'w-1.5 h-1.5 rounded-full bg-outline' },
});

// ---------------------------------------------------------------------------------------------
// Waktu relatif WIB ("10 mnt lalu", "1 jam lalu", "2 hari lalu") dari dibuat_pada.
// mysql2 mengembalikan Date yang instannya sudah benar (pool timezone +07:00); string
// 'YYYY-MM-DD HH:mm:ss' dianggap WIB (aturan zona waktu: jangan percaya zona mesin).
// ---------------------------------------------------------------------------------------------
function keDate(nilai) {
  if (nilai instanceof Date) return nilai;
  const m = String(nilai ?? '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)) - 7 * 3600 * 1000);
}

function waktuRelatif(nilai, sekarang = Date.now()) {
  const d = keDate(nilai);
  if (!d) return '';
  const detik = Math.max(0, Math.round((sekarang - d.getTime()) / 1000));
  if (detik < 60) return 'baru saja';
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return formatTanggalID(nilai);
}

/** Label bulan grafik dari 'YYYY-MM' -> 'Sep' (dan 'Sep 2026' untuk teks pembaca layar). */
function labelBulan(yyyymm, denganTahun = false) {
  const [tahun, bulan] = String(yyyymm).split('-').map(Number);
  const nama = BULAN_SINGKAT[(bulan || 1) - 1] ?? yyyymm;
  return denganTahun ? `${nama} ${tahun}` : nama;
}

// ---------------------------------------------------------------------------------------------
// Panel samping: peta aksi audit -> kalimat Indonesia + ikon (+ lingkaran emas untuk aksi pengaduan).
// Kalimat dipakai sebagai "<nama_user> <kalimat> #<id_terkait>"; `sistem: true` = tanpa nama pelaku.
// ---------------------------------------------------------------------------------------------
const KALIMAT_AUDIT = Object.freeze({
  artikel_buat: { kalimat: 'menulis artikel', ikon: 'edit' },
  artikel_sunting: { kalimat: 'memperbarui artikel', ikon: 'edit' },
  artikel_terbit: { kalimat: 'menerbitkan artikel', ikon: 'edit' },
  artikel_arsip: { kalimat: 'mengarsipkan artikel', ikon: 'edit' },
  artikel_hapus: { kalimat: 'menghapus artikel', ikon: 'delete' },
  pengaduan_masuk: { kalimat: 'Sistem menerima pengaduan', ikon: 'campaign', emas: true, sistem: true },
  pengaduan_tugaskan: { kalimat: 'menugaskan pengaduan', ikon: 'gavel', emas: true },
  pengaduan_ubah_status: { kalimat: 'mengubah status pengaduan', ikon: 'gavel', emas: true },
  lihat_identitas_pelapor: { kalimat: 'membuka identitas pelapor pengaduan', ikon: 'visibility', emas: true },
  lihat_lampiran_pengaduan: { kalimat: 'membuka lampiran pengaduan', ikon: 'visibility', emas: true },
  login_berhasil: { kalimat: 'masuk ke sistem', ikon: 'login' },
  login_gagal: { kalimat: 'Sistem mendeteksi percobaan masuk yang gagal', ikon: 'warning', sistem: true },
  logout: { kalimat: 'keluar dari sistem', ikon: 'logout' },
  ganti_sandi_sendiri: { kalimat: 'mengganti kata sandi', ikon: 'key' },
  unggah_gambar: { kalimat: 'mengunggah gambar', ikon: 'image' },
  pengaturan_simpan: { kalimat: 'menyimpan pengaturan situs', ikon: 'settings' },
  pengguna_buat: { kalimat: 'menambah pengguna', ikon: 'person' },
  pengguna_ubah: { kalimat: 'memperbarui pengguna', ikon: 'person' },
  pengguna_hapus: { kalimat: 'menghapus pengguna', ikon: 'person' },
  pengguna_paksa_keluar: { kalimat: 'memaksa keluar pengguna', ikon: 'person' },
  pengguna_reset_sandi: { kalimat: 'mereset kata sandi pengguna', ikon: 'key' },
  pengurus_buat: { kalimat: 'menambah pengurus', ikon: 'badge' },
  pengurus_ubah: { kalimat: 'memperbarui pengurus', ikon: 'badge' },
  pengurus_hapus: { kalimat: 'menghapus pengurus', ikon: 'badge' },
  pengurus_urutan: { kalimat: 'mengubah urutan pengurus', ikon: 'badge' },
  program_buat: { kalimat: 'menambah program', ikon: 'campaign' },
  program_ubah: { kalimat: 'memperbarui program', ikon: 'campaign' },
  program_hapus: { kalimat: 'menghapus program', ikon: 'campaign' },
  galeri_buat: { kalimat: 'menambah dokumentasi galeri', ikon: 'image' },
  galeri_ubah: { kalimat: 'memperbarui dokumentasi galeri', ikon: 'image' },
  galeri_hapus: { kalimat: 'menghapus dokumentasi galeri', ikon: 'image' },
});

/** Bentuk butir panel: { kunci, ikon, emas, awalan, tebal, waktu }. */
function butirAudit(a) {
  const peta = KALIMAT_AUDIT[a.aksi] ?? { kalimat: String(a.aksi ?? '').replace(/_/g, ' '), ikon: 'update' };
  const pelaku = peta.sistem ? '' : `${a.nama_user ?? 'Sistem'} `;
  return {
    kunci: `audit-${a.id}`,
    ikon: peta.ikon,
    emas: Boolean(peta.emas),
    awalan: `${pelaku}${peta.kalimat}`,
    tebal: a.id_terkait != null ? `#${a.id_terkait}` : null,
    waktu: a.dibuat_pada,
  };
}

function butirPengaduan(p) {
  return {
    kunci: `pengaduan-${p.id}`,
    ikon: 'campaign',
    emas: true,
    awalan: `${labelKategoriPengaduan(p.kategori_masalah)}${p.wilayah_nama ? ` · ${p.wilayah_nama}` : ''}`,
    tebal: `#${p.nomor_kasus}`,
    waktu: p.dibuat_pada,
  };
}

function butirArtikel(a) {
  return {
    kunci: `artikel-${a.id}`,
    ikon: 'edit',
    emas: false,
    awalan: `${a.penulis_nama} ·`,
    tebal: a.judul,
    waktu: a.diperbarui_pada ?? a.dibuat_pada,
  };
}

// Definisi panel samping. `muat` menerima {pengguna, wilayahId} dan mengembalikan butir[].
const PANEL = Object.freeze({
  aktivitas: {
    judul: 'Aktivitas Staf',
    ikonKosong: 'update',
    kosong: 'Belum ada aktivitas staf yang tercatat.',
    muat: async () => (await ambilAktivitasTerbaru(BATAS_PANEL)).map(butirAudit),
  },
  'pengaduan-baru': {
    judul: 'Menunggu Verifikasi',
    ikonKosong: 'campaign',
    kosong: 'Tidak ada pengaduan berstatus baru.',
    // bolehLihatIdentitas SENGAJA false: panel ini tidak butuh identitas pelapor (aturan 3).
    muat: async ({ wilayahId }) => (await daftarPengaduan({ status: 'baru', wilayahId, bolehLihatIdentitas: false, perHalaman: BATAS_PANEL })).baris.map(butirPengaduan),
  },
  artikel: {
    judul: 'Artikel Terbaru',
    ikonKosong: 'article',
    kosong: 'Belum ada artikel di wilayah Anda.',
    muat: async ({ pengguna, wilayahId }) => (await artikelTerbaruDashboard({ peran: pengguna.peran, userId: pengguna.id, wilayahId, batas: BATAS_PANEL })).map(butirArtikel),
  },
  'draf-redaksi': {
    judul: 'Draf Menunggu Terbit',
    ikonKosong: 'edit_document',
    kosong: 'Tidak ada draf yang menunggu diterbitkan.',
    muat: async ({ pengguna, wilayahId }) => (await ambilArtikelStaf({ peran: pengguna.peran, userId: pengguna.id, wilayahId, status: 'draf', perHalaman: BATAS_PANEL })).baris.map(butirArtikel),
  },
  'draf-saya': {
    judul: 'Draf Saya',
    ikonKosong: 'edit_document',
    kosong: 'Anda belum memiliki draf artikel.',
    muat: async ({ pengguna, wilayahId }) => (await ambilArtikelStaf({ peran: pengguna.peran, userId: pengguna.id, wilayahId, status: 'draf', perHalaman: BATAS_PANEL })).baris.map(butirArtikel),
  },
});

// Definisi tabel bawah.
const TABEL = Object.freeze({
  pengaduan: {
    judul: 'Pengaduan Terbaru',
    hrefSemua: '/staf/pengaduan',
    ikonKosong: 'gavel',
    kosong: 'Belum ada pengaduan yang masuk.',
    muat: async ({ wilayahId }) => pengaduanTerbaru({ batas: BATAS_TABEL, wilayahId }),
  },
  artikel: {
    judul: 'Artikel Terbaru',
    hrefSemua: '/staf/artikel',
    ikonKosong: 'article',
    kosong: 'Belum ada artikel yang dapat Anda kelola.',
    muat: async ({ pengguna, wilayahId }) => artikelTerbaruDashboard({ peran: pengguna.peran, userId: pengguna.id, wilayahId, batas: BATAS_TABEL }),
  },
});

// SATU peta konfigurasi per peran (bukan tumpukan if). Kunci = peran dari lib/auth/hakAkses PERAN.
const TAMPILAN_PERAN = Object.freeze({
  superadmin: { panel: 'aktivitas', tabel: 'pengaduan' },
  verifikator: { panel: 'pengaduan-baru', tabel: 'pengaduan' },
  pimpinan_wilayah: { panel: 'artikel', tabel: 'pengaduan' },
  redaktur: { panel: 'draf-redaksi', tabel: 'artikel' },
  penulis: { panel: 'draf-saya', tabel: 'artikel' },
});

export default async function HalamanDashboard() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  const tampilan = TAMPILAN_PERAN[pengguna.peran];
  if (!tampilan || !HAK.statistik.includes(pengguna.peran)) redirect('/tanpa-akses');
  // Pagar kedua: tabel pengaduan hanya untuk peran pengaduan_lihat (konfigurasi tidak boleh membocorkannya).
  if (tampilan.tabel === 'pengaduan' && !HAK.pengaduan_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const wilayahId = wilayahTerbatas(pengguna);
  const konteks = { pengguna, wilayahId };
  const panel = PANEL[tampilan.panel];
  const tabel = TABEL[tampilan.tabel];
  const bolehProsesPengaduan = HAK.pengaduan_ubah_status.includes(pengguna.peran);

  const [kartu, tren, butirPanel, barisTabel] = await Promise.all([
    hitungStatistikDashboard({ peran: pengguna.peran, userId: pengguna.id, wilayahId }),
    trenLaporanBulanan({ bulan: BULAN_TREN, wilayahId }),
    panel.muat(konteks),
    tabel.muat(konteks),
  ]);

  const maksTren = Math.max(0, ...tren.map((t) => Number(t.jumlah) || 0));
  const bulanBerjalan = tren.length ? tren[tren.length - 1].bulan : null;
  // Tinggi batang relatif ke nilai maksimum; minimum 2% agar bulan bernilai nol tetap tergambar.
  const tinggiBatang = (jumlah) => (maksTren > 0 ? Math.max(2, Math.round((Number(jumlah) / maksTren) * 100)) : 2);

  return (
    <>
      {/* Header Area */}
      <header className="px-margin-desktop py-8 bg-surface-lowest border-b border-tertiary/20">
        <h2 className="font-headline-lg text-headline-lg text-primary">Tinjauan Pengawasan</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Status pelaporan dan operasional hari ini.</p>
      </header>
      <div className="p-margin-desktop space-y-gutter max-w-container-max mx-auto">
        {/* Top Summary Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col relative overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(115,92,0,0.05)' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-md text-label-md text-on-surface-variant">Total Artikel</span>
              <div className="bg-surface-container-low p-2 rounded-md border border-outline-variant/50 text-secondary">
                <Ikon nama="article" />
              </div>
            </div>
            <div className="font-headline-xl text-headline-xl text-primary">{formatAngkaID(kartu.totalArtikel)}</div>
            <p className="font-body-md text-body-md text-outline mt-2">{`+${formatAngkaID(kartu.artikelBulanIni)} bulan ini`}</p>
          </div>
          {/* Card 2 */}
          <div className="bg-surface-container-lowest border border-secondary-fixed rounded-lg p-6 flex flex-col relative overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(233,195,73,0.15)' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-md text-label-md text-on-surface-variant">Pengaduan Masuk</span>
              <div className="bg-secondary-fixed p-2 rounded-md text-on-secondary-fixed-variant">
                <Ikon nama="campaign" terisi />
              </div>
            </div>
            <div className="font-headline-xl text-headline-xl text-primary">{formatAngkaID(kartu.pengaduanMasuk)}</div>
            <p className="font-body-md text-body-md text-secondary font-semibold mt-2">Menunggu Verifikasi</p>
          </div>
          {/* Card 3 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col relative overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(115,92,0,0.05)' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-md text-label-md text-on-surface-variant">Laporan Selesai</span>
              <div className="bg-surface-container-low p-2 rounded-md border border-outline-variant/50 text-tertiary">
                <Ikon nama="check_circle" />
              </div>
            </div>
            <div className="font-headline-xl text-headline-xl text-primary">{formatAngkaID(kartu.pengaduanSelesai)}</div>
            <p className="font-body-md text-body-md text-outline mt-2">Resolusi tuntas</p>
          </div>
        </section>
        {/* Middle Section: Chart & Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col">
            <h3 className="font-headline-md text-headline-md text-primary mb-6">Tren Laporan Bulanan</h3>
            <div className="flex-1 w-full bg-surface-container-low/30 border border-outline-variant/30 rounded flex items-center justify-center relative min-h-[300px]" role="img" aria-label={`Grafik batang jumlah pengaduan per bulan, ${BULAN_TREN} bulan terakhir`}>
              {/* Simple visual representation of a chart — KEPUTUSAN BARU: 12 batang (w-1/12) untuk 12 bulan,
                  desain menggambar 6 batang w-1/6; bulan berjalan memakai bg-secondary-fixed-dim seperti desain */}
              <div className="absolute bottom-0 left-0 w-full h-full flex items-end px-4 py-2 gap-4">
                {tren.map((t) => (
                  <div
                    key={t.bulan}
                    className={`w-1/12 ${t.bulan === bulanBerjalan ? 'bg-secondary-fixed-dim' : 'bg-secondary-container'} rounded-t-sm`}
                    style={{ height: `${tinggiBatang(t.jumlah)}%` }}
                    title={`${labelBulan(t.bulan, true)}: ${formatAngkaID(t.jumlah)} laporan`}
                  >
                    <span className="sr-only">{`${labelBulan(t.bulan, true)}: ${formatAngkaID(t.jumlah)} laporan`}</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                <div className="w-full border-b border-outline"></div>
                <div className="w-full border-b border-outline"></div>
                <div className="w-full border-b border-outline"></div>
                <div className="w-full border-b border-outline"></div>
              </div>
            </div>
            {/* KEPUTUSAN BARU: label bulan di bawah batang (desain tanpa label); kelas dari layar ini saja,
                lebar & jarak kolom sama persis dengan baris batang (px-4 gap-4 w-1/12) agar sejajar */}
            <div className="w-full flex px-4 gap-4 mt-2" aria-hidden="true">
              {tren.map((t) => (
                <span key={t.bulan} className="w-1/12 font-label-md text-label-md text-outline text-xs">{labelBulan(t.bulan)}</span>
              ))}
            </div>
          </div>
          {/* Staff Activity Sidebar */}
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
            <h3 className="font-headline-md text-headline-md text-primary mb-6">{panel.judul}</h3>
            {butirPanel.length === 0 ? (
              <KeadaanKosong ikon={panel.ikonKosong} judul="Belum ada data" keterangan={panel.kosong} />
            ) : (
              <ul className="space-y-4">
                {butirPanel.map((b) => (
                  <li key={b.kunci} className="flex gap-3">
                    <div className={b.emas ? KELAS_LINGKARAN_EMAS : KELAS_LINGKARAN_ABU}>
                      <Ikon nama={b.ikon} className="text-sm" />
                    </div>
                    <div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {b.awalan}
                        {b.tebal ? <> <span className="font-semibold">{b.tebal}</span></> : null}
                      </p>
                      <p className="font-label-md text-label-md text-outline mt-1">{waktuRelatif(b.waktu)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        {/* Bottom Section: Data Table */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <h3 className="font-headline-md text-headline-md text-primary">{tabel.judul}</h3>
            <Link href={tabel.hrefSemua} className="font-label-md text-label-md text-secondary hover:underline flex items-center gap-1">
              Lihat Semua <Ikon nama="arrow_forward" className="text-sm" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {barisTabel.length === 0 ? (
              <KeadaanKosong ikon={tabel.ikonKosong} judul="Belum ada data" keterangan={tabel.kosong} className="m-6" />
            ) : tampilan.tabel === 'pengaduan' ? (
              <table className="w-full text-left border-collapse">
                {/* Admin Data Tables rule: Header Primary bg, Label-MD in White/Gold */}
                <thead className="bg-primary text-on-primary font-label-md text-label-md">
                  <tr>
                    <th scope="col" className="py-4 px-6 font-semibold">ID</th>
                    <th scope="col" className="py-4 px-6 font-semibold text-secondary-fixed">Region</th>
                    <th scope="col" className="py-4 px-6 font-semibold">Tanggal</th>
                    <th scope="col" className="py-4 px-6 font-semibold">Status</th>
                    <th scope="col" className="py-4 px-6 font-semibold text-right">Tindakan</th>
                  </tr>
                </thead>
                {/* Rows: Alternating subtle Tan zebra-striping */}
                <tbody className="font-body-md text-body-md text-on-surface divide-y divide-tertiary-fixed-dim/50">
                  {barisTabel.map((p) => (
                    <tr key={p.id} className={KELAS_BARIS}>
                      <td className="py-4 px-6 font-mono text-sm">{`#${p.nomor_kasus}`}</td>
                      <td className="py-4 px-6">{p.wilayah_nama ?? '—'}</td>
                      <td className="py-4 px-6 text-outline">{formatTanggalID(p.dibuat_pada)}</td>
                      <td className="py-4 px-6">
                        {/* Verification Chip Rule — lencana kanonik REFERENSI 10 (components/ui/Lencana) */}
                        <Lencana status={p.status} />
                      </td>
                      <td className="py-4 px-6 text-right flex justify-end gap-2">
                        <Link aria-label={`Lihat pengaduan ${p.nomor_kasus}`} className={KELAS_TOMBOL_LIHAT} href={`/staf/pengaduan/${p.id}`}>
                          <Ikon nama="visibility" />
                        </Link>
                        {bolehProsesPengaduan ? (
                          <Link aria-label={`Proses pengaduan ${p.nomor_kasus}`} className={KELAS_TOMBOL_PROSES} href={`/staf/pengaduan/${p.id}`}>
                            <Ikon nama="gavel" />
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary text-on-primary font-label-md text-label-md">
                  <tr>
                    <th scope="col" className="py-4 px-6 font-semibold">Judul</th>
                    <th scope="col" className="py-4 px-6 font-semibold text-secondary-fixed">Kategori</th>
                    <th scope="col" className="py-4 px-6 font-semibold">Penulis</th>
                    <th scope="col" className="py-4 px-6 font-semibold">Status</th>
                    <th scope="col" className="py-4 px-6 font-semibold text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface divide-y divide-tertiary-fixed-dim/50">
                  {barisTabel.map((a) => {
                    const chip = CHIP_ARTIKEL[a.status] ?? CHIP_ARTIKEL.draf;
                    return (
                      <tr key={a.id} className={KELAS_BARIS}>
                        <td className="py-4 px-6">{a.judul}</td>
                        <td className="py-4 px-6">{a.kategori_nama}</td>
                        <td className="py-4 px-6 text-outline">{a.penulis_nama}</td>
                        <td className="py-4 px-6">
                          <span className={chip.kelas}>
                            <span className={chip.titik}></span>
                            {chip.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right flex justify-end gap-2">
                          <Link aria-label={`Lihat artikel ${a.judul}`} className={KELAS_TOMBOL_LIHAT} href={`/staf/artikel/${a.id}`}>
                            <Ikon nama="visibility" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
        {/* Spacer for bottom scrolling */}
        <div className="h-12"></div>
      </div>
    </>
  );
}
