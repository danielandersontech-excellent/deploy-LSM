// app/(publik)/lacak/page.js — pelacakan status pengaduan publik (TAHAP-06 §4, aturan 13).
//
// Halaman ini TIDAK digambar Stitch -> KEPUTUSAN BARU (REFERENSI 18.4). Cetakan:
// kontak_pengaduan_warkop_nusantara_updated_logo/code.html — kepala halaman, kartu
// "Hubungi Kami" (ikon berkotak + label + nilai), kartu "Kerahasiaan Dijamin" (verbatim),
// panel bg-primary "Formulir Pengaduan Resmi", input bergaris bawah (.form-input-focus),
// tombol kirim, dan lingkaran bernomor indikator langkah (dipakai untuk LINIMASA).
// Hanya kelas yang ada di layar itu (+ kelas pesan info dari components/staf/FormulirLogin.js).
//
// Yang ditampilkan: nomor kasus, kategori, wilayah, status, tanggal masuk/diperbarui, linimasa status.
// TIDAK PERNAH: identitas pelapor, catatan internal, nama petugas — ambilPengaduanByNomor()
// memang tidak men-SELECT kolom itu (penyaringan di SQL, bukan JavaScript).
// Nomor tidak ada / format salah -> pesan NETRAL yang sama (PESAN_TIDAK_DITEMUKAN).
// Pembatas laju per IP sama dengan GET /api/pengaduan/lacak/[nomor] (namespace 'lacak').
// Formulir GET murni: bekerja tanpa JavaScript; nomor tercermin di URL (?nomor=).
import Ikon from '@/components/ui/Ikon';
import Lencana from '@/components/ui/Lencana';
import { ambilPengaduanByNomor, nomorKasusValid } from '@/lib/db/pengaduan';
import { periksaLaju, pesanDibatasi } from '@/lib/pembatasLajuUmum';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { labelKategoriPengaduan, labelStatusPengaduan, STATUS_PENGADUAN } from '@/lib/kategoriPengaduan';
import { PESAN_TIDAK_DITEMUKAN } from '@/lib/validasi/pengaduan';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Lacak Pengaduan',
  description: 'Lacak status dan riwayat penanganan pengaduan Anda dengan nomor kasus WRP-XXXXXX, tanpa login dan tanpa membuka identitas pelapor.',
};

// Kelas pesan info — identik dengan KELAS_PESAN_INFO di components/staf/FormulirLogin.js.
const KELAS_PESAN_INFO = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

// KEPUTUSAN BARU: penjelasan satu kalimat arti tiap status (TAHAP-06 §4 tidak memberi teks).
const ARTI_STATUS = Object.freeze({
  baru: 'Laporan sudah kami terima dan menunggu pemeriksaan awal oleh verifikator.',
  diverifikasi: 'Laporan telah diperiksa kelengkapannya dan dinyatakan layak ditindaklanjuti.',
  diproses: 'Tim kami sedang menangani laporan ini bersama pihak-pihak terkait.',
  selesai: 'Penanganan laporan telah dirampungkan dan kasus ditutup.',
  ditolak: 'Laporan tidak dapat kami tindaklanjuti, misalnya karena di luar kewenangan atau bukti tidak memadai.',
});

const NOMOR_MAKS = 20;

export default async function HalamanLacak({ searchParams }) {
  const sp = await searchParams;
  const dikirim = Object.prototype.hasOwnProperty.call(sp ?? {}, 'nomor');
  const nomorInput = String(sp?.nomor ?? '').slice(0, NOMOR_MAKS);
  const nomorBersih = nomorInput.trim().toUpperCase();

  let pesan = null;      // teks pesan netral / pembatas laju
  let pengaduan = null;  // hasil publik (tanpa identitas)
  if (dikirim) {
    const laju = periksaLaju('lacak', await alamatIpPermintaan());
    if (laju.dibatasi) {
      pesan = pesanDibatasi(laju.sisaDetik);
    } else if (!nomorKasusValid(nomorBersih)) {
      // Format salah dibalas SAMA dengan nomor tidak ada — tidak ada informasi tambahan.
      pesan = PESAN_TIDAK_DITEMUKAN;
    } else {
      pengaduan = await ambilPengaduanByNomor(nomorBersih);
      if (!pengaduan) pesan = PESAN_TIDAK_DITEMUKAN;
    }
  }

  const riwayat = pengaduan?.riwayat ?? [];
  const indeksTerakhir = riwayat.length - 1;

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12" id="konten-utama">
      {/* Header Section */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Lacak Status Pengaduan</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Masukkan nomor kasus yang Anda terima saat mengirim laporan untuk melihat status dan riwayat penanganannya. Tidak perlu masuk akun.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Side: Petunjuk & jaminan kerahasiaan */}
        <div className="lg:col-span-4 space-y-6">
          {/* Kartu petunjuk (cetakan kartu "Hubungi Kami") */}
          <div className="bg-surface-container-lowest border border-tertiary p-6 rounded-lg pressed-paper-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Ikon nama="contact_support" className="text-[120px]" />
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-6 flex items-center gap-2 border-b border-outline-variant pb-3">
              <Ikon nama="contact_phone" />
              Cara Melacak
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-surface-container-high p-2 rounded text-primary">
                  <Ikon nama="badge" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary mb-1">Nomor Kasus</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Berformat WRP-XXXXXX (enam angka), tercantum di halaman konfirmasi saat laporan Anda diterima. Simpan nomor ini baik-baik.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-surface-container-high p-2 rounded text-primary">
                  <Ikon nama="schedule" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary mb-1">Pembaruan Status</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Setiap perubahan status dicatat beserta waktunya (WIB). Periksa kembali secara berkala.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-surface-container-high p-2 rounded text-primary">
                  <Ikon nama="call" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary mb-1">Hotline Pengaduan (24/7)</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">0800-1-WARKOP (927567)</p>
                </div>
              </div>
            </div>
          </div>
          {/* Trust Badge */}
          <div className="bg-secondary-fixed/20 border border-secondary-fixed p-4 rounded-lg flex items-center gap-4">
            <div className="bg-secondary text-on-secondary p-3 rounded-full flex-shrink-0">
              <Ikon nama="security" className="text-[28px]" terisi />
            </div>
            <div>
              <h4 className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Kerahasiaan Dijamin</h4>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">Identitas pelapor dilindungi sepenuhnya oleh protokol keamanan tingkat tinggi kami.</p>
            </div>
          </div>
        </div>
        {/* Right Side: Formulir pelacakan + hasil */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-tertiary rounded-lg pressed-paper-shadow">
          {/* Form Header */}
          <div className="bg-primary p-6 rounded-t-lg border-b border-tertiary">
            <h2 className="font-headline-md text-headline-md text-on-primary flex items-center gap-3">
              <Ikon nama="search" className="text-secondary-fixed" />
              Pelacakan Nomor Kasus
            </h2>
            <p className="font-body-md text-body-md text-on-primary-container mt-1">Masukkan nomor kasus persis seperti yang tertera pada bukti penerimaan laporan.</p>
          </div>
          <form className="p-6 space-y-8" method="get" action="/lacak" role="search">
            <section className="space-y-5">
              <div className="form-input-focus border-b border-outline-variant transition-colors">
                <label className="font-label-md text-label-md text-primary block mb-1" htmlFor="nomor">Nomor Kasus</label>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0"
                  id="nomor"
                  name="nomor"
                  type="text"
                  placeholder="WRP-XXXXXX"
                  defaultValue={nomorInput}
                  maxLength={NOMOR_MAKS}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                />
              </div>
            </section>
            {/* Form Actions */}
            <div className="pt-6 border-t border-outline-variant flex justify-end gap-4">
              <button className="px-6 py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm" type="submit">
                Lacak Status
                <Ikon nama="search" className="text-[18px]" />
              </button>
            </div>
          </form>

          {pesan ? (
            <div className="p-6 space-y-8">
              <div role="status" aria-live="polite" className={KELAS_PESAN_INFO}>{pesan}</div>
            </div>
          ) : null}

          {pengaduan ? (
            <div className="p-6 space-y-8" aria-live="polite">
              {/* Ringkasan kasus */}
              <section className="space-y-5">
                <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
                  Hasil Pelacakan
                </h3>
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <Ikon nama="badge" className="text-on-surface-variant" />
                    <div>
                      <p className="font-label-md text-label-md text-primary mb-1">Nomor Kasus</p>
                      <p className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">{pengaduan.nomor_kasus}</p>
                    </div>
                  </div>
                  <Lencana status={pengaduan.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-high p-2 rounded text-primary">
                      <Ikon nama="sell" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-primary mb-1">Kategori Masalah</p>
                      <p className="font-body-md text-body-md text-on-surface-variant">{labelKategoriPengaduan(pengaduan.kategori_masalah)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-high p-2 rounded text-primary">
                      <Ikon nama="location_on" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-primary mb-1">Wilayah Kejadian</p>
                      <p className="font-body-md text-body-md text-on-surface-variant">{pengaduan.wilayah_nama || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-high p-2 rounded text-primary">
                      <Ikon nama="calendar_today" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-primary mb-1">Tanggal Masuk</p>
                      <p className="font-body-md text-body-md text-on-surface-variant">{formatTanggalID(pengaduan.dibuat_pada, 'lengkap')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-high p-2 rounded text-primary">
                      <Ikon nama="update" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-primary mb-1">Terakhir Diperbarui</p>
                      <p className="font-body-md text-body-md text-on-surface-variant">{formatTanggalID(pengaduan.diperbarui_pada, 'lengkap')}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Linimasa status (lingkaran bernomor dari indikator langkah; langkah terakhir = aktif) */}
              <section className="space-y-5 pt-4">
                <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
                  Linimasa Penanganan
                </h3>
                <ol className="space-y-4">
                  {riwayat.map((r, i) => (
                    <li key={`${r.status_sesudah}-${i}`} className="flex items-start gap-4">
                      <div
                        className={i === indeksTerakhir
                          ? 'w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm flex-shrink-0'
                          : 'w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-sm flex-shrink-0'}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-primary mb-1">{labelStatusPengaduan(r.status_sesudah)}</p>
                        <p className="font-body-md text-body-md text-on-surface-variant text-sm">{formatTanggalID(r.dibuat_pada, 'lengkap')}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Arti status (KEPUTUSAN BARU: teks penjelasan satu kalimat) */}
              <section className="space-y-5 pt-4">
                <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
                  Arti Status
                </h3>
                <div className="space-y-2">
                  {STATUS_PENGADUAN.map((s) => (
                    <div key={s.slug} className="flex items-start gap-4">
                      <Lencana status={s.slug} className="flex-shrink-0" />
                      <p className="font-body-md text-body-md text-on-surface-variant text-sm">{ARTI_STATUS[s.slug]}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
