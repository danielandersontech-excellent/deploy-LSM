// app/uji-desain/page.js — SEMENTARA (dihapus di Tahap 9).
// Dibangkitkan dari tailwind.config.js: seluruh token warna, 8 tingkat tipografi,
// radius, jarak, 77 ikon Ikon.js dalam tiga ukuran + varian terisi, dan blok
// formulir contoh berkelas persis kontak_pengaduan_warkop_nusantara_updated_logo/code.html
// (memastikan plugin @tailwindcss/forms aktif). Untuk UJI d, m, n Tahap 0.
import Ikon, { DAFTAR_IKON } from '@/components/ui/Ikon';

const TOKEN_WARNA = [
  { nama: 'background', hex: '#faf9f5', kelas: 'bg-background' },
  { nama: 'error', hex: '#ba1a1a', kelas: 'bg-error' },
  { nama: 'error-container', hex: '#ffdad6', kelas: 'bg-error-container' },
  { nama: 'inverse-on-surface', hex: '#f2f1ed', kelas: 'bg-inverse-on-surface' },
  { nama: 'inverse-primary', hex: '#e3beb8', kelas: 'bg-inverse-primary' },
  { nama: 'inverse-surface', hex: '#2f312e', kelas: 'bg-inverse-surface' },
  { nama: 'on-background', hex: '#1b1c1a', kelas: 'bg-on-background' },
  { nama: 'on-error', hex: '#ffffff', kelas: 'bg-on-error' },
  { nama: 'on-error-container', hex: '#93000a', kelas: 'bg-on-error-container' },
  { nama: 'on-primary', hex: '#ffffff', kelas: 'bg-on-primary' },
  { nama: 'on-primary-container', hex: '#ae8d87', kelas: 'bg-on-primary-container' },
  { nama: 'on-primary-fixed', hex: '#2b1613', kelas: 'bg-on-primary-fixed' },
  { nama: 'on-primary-fixed-variant', hex: '#5b403c', kelas: 'bg-on-primary-fixed-variant' },
  { nama: 'on-secondary', hex: '#ffffff', kelas: 'bg-on-secondary' },
  { nama: 'on-secondary-container', hex: '#745c00', kelas: 'bg-on-secondary-container' },
  { nama: 'on-secondary-fixed', hex: '#241a00', kelas: 'bg-on-secondary-fixed' },
  { nama: 'on-secondary-fixed-variant', hex: '#574500', kelas: 'bg-on-secondary-fixed-variant' },
  { nama: 'on-surface', hex: '#1b1c1a', kelas: 'bg-on-surface' },
  { nama: 'on-surface-variant', hex: '#504442', kelas: 'bg-on-surface-variant' },
  { nama: 'on-tertiary', hex: '#ffffff', kelas: 'bg-on-tertiary' },
  { nama: 'on-tertiary-container', hex: '#a88f86', kelas: 'bg-on-tertiary-container' },
  { nama: 'on-tertiary-fixed', hex: '#271812', kelas: 'bg-on-tertiary-fixed' },
  { nama: 'on-tertiary-fixed-variant', hex: '#56423b', kelas: 'bg-on-tertiary-fixed-variant' },
  { nama: 'outline', hex: '#827472', kelas: 'bg-outline' },
  { nama: 'outline-variant', hex: '#d3c3c0', kelas: 'bg-outline-variant' },
  { nama: 'primary', hex: '#271310', kelas: 'bg-primary' },
  { nama: 'primary-container', hex: '#3e2723', kelas: 'bg-primary-container' },
  { nama: 'primary-fixed', hex: '#ffdad4', kelas: 'bg-primary-fixed' },
  { nama: 'primary-fixed-dim', hex: '#e3beb8', kelas: 'bg-primary-fixed-dim' },
  { nama: 'secondary', hex: '#735c00', kelas: 'bg-secondary' },
  { nama: 'secondary-container', hex: '#fed65b', kelas: 'bg-secondary-container' },
  { nama: 'secondary-fixed', hex: '#ffe088', kelas: 'bg-secondary-fixed' },
  { nama: 'secondary-fixed-dim', hex: '#e9c349', kelas: 'bg-secondary-fixed-dim' },
  { nama: 'surface', hex: '#faf9f5', kelas: 'bg-surface' },
  { nama: 'surface-bright', hex: '#faf9f5', kelas: 'bg-surface-bright' },
  { nama: 'surface-container', hex: '#efeeea', kelas: 'bg-surface-container' },
  { nama: 'surface-container-high', hex: '#e9e8e4', kelas: 'bg-surface-container-high' },
  { nama: 'surface-container-highest', hex: '#e3e2df', kelas: 'bg-surface-container-highest' },
  { nama: 'surface-container-low', hex: '#f4f4f0', kelas: 'bg-surface-container-low' },
  { nama: 'surface-container-lowest', hex: '#ffffff', kelas: 'bg-surface-container-lowest' },
  { nama: 'surface-dim', hex: '#dbdad6', kelas: 'bg-surface-dim' },
  { nama: 'surface-tint', hex: '#745853', kelas: 'bg-surface-tint' },
  { nama: 'surface-variant', hex: '#e3e2df', kelas: 'bg-surface-variant' },
  { nama: 'tertiary', hex: '#24150f', kelas: 'bg-tertiary' },
  { nama: 'tertiary-container', hex: '#3a2922', kelas: 'bg-tertiary-container' },
  { nama: 'tertiary-fixed', hex: '#fadcd2', kelas: 'bg-tertiary-fixed' },
  { nama: 'tertiary-fixed-dim', hex: '#ddc1b7', kelas: 'bg-tertiary-fixed-dim' },
];

const TIPOGRAFI = [
  { nama: 'headline-xl', kelas: 'font-headline-xl text-headline-xl', keterangan: '48px / 56px / 700 / -0.02em', contoh: "Berani Karena Benar" },
  { nama: 'headline-lg', kelas: 'font-headline-lg text-headline-lg', keterangan: '32px / 40px / 700', contoh: "Laporan Investigasi Dana Desa" },
  { nama: 'body-lg', kelas: 'font-body-lg text-body-lg', keterangan: '18px / 28px / 400', contoh: "Lembaga swadaya masyarakat yang menjalankan fungsi kontrol sosial, observasi, dan pengawasan publik." },
  { nama: 'body-md', kelas: 'font-body-md text-body-md', keterangan: '16px / 24px / 400', contoh: "Pengaduan boleh anonim; identitas pelapor dilindungi berlapis dan setiap perubahan status terekam permanen." },
  { nama: 'label-md', kelas: 'font-label-md text-label-md', keterangan: '14px / 20px / 600 / 0.05em', contoh: "Kontak & Pengaduan" },
  { nama: 'motto', kelas: 'font-motto text-motto', keterangan: '16px / 24px / 500', contoh: "Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara." },
  { nama: 'headline-md', kelas: 'font-headline-md text-headline-md', keterangan: '24px / 32px / 600', contoh: "Wadah Aspirasi Rakyat" },
  { nama: 'headline-lg-mobile', kelas: 'font-headline-lg-mobile text-headline-lg-mobile', keterangan: '28px / 36px / 700', contoh: "Pengawasan Publik Nusantara" },
];

const RADIUS = [
  { nama: 'DEFAULT', nilai: '0.25rem', kelas: 'rounded' },
  { nama: 'lg', nilai: '0.5rem', kelas: 'rounded-lg' },
  { nama: 'xl', nilai: '0.75rem', kelas: 'rounded-xl' },
  { nama: 'full', nilai: '9999px', kelas: 'rounded-full' },
];

const SPACING = [
  { nama: 'container-max', nilai: '1280px', kelas: 'w-container-max' },
  { nama: 'margin-mobile', nilai: '16px', kelas: 'w-margin-mobile' },
  { nama: 'margin-desktop', nilai: '40px', kelas: 'w-margin-desktop' },
  { nama: 'unit', nilai: '8px', kelas: 'w-unit' },
  { nama: 'gutter', nilai: '24px', kelas: 'w-gutter' },
];

function Bagian({ judul, children }) {
  return (
    <section className="mb-12">
      <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2 mb-6">{judul}</h2>
      {children}
    </section>
  );
}

export const metadata = { title: 'Uji desain (sementara)' };

export default function HalamanUjiDesain() {
  return (
    <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Uji token desain — WARKOP NUSANTARA</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-10">
        Halaman sementara Tahap 0. Dibandingkan dengan beranda_warkop_nusantara/screen.png.
      </p>

      <Bagian judul={`Warna (${TOKEN_WARNA.length} token)`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {TOKEN_WARNA.map((w) => (
            <div key={w.nama} className="border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
              <div className={`h-16 ${w.kelas}`} data-token={w.nama} />
              <div className="p-2">
                <div className="font-label-md text-label-md text-on-surface text-xs break-all">{w.nama}</div>
                <div className="font-body-md text-body-md text-on-surface-variant text-xs">{w.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Bagian>

      <Bagian judul="Tipografi (8 tingkat)">
        <div className="flex flex-col gap-6">
          {TIPOGRAFI.map((tp) => (
            <div key={tp.nama}>
              <div className="font-label-md text-label-md text-on-surface-variant text-xs mb-1">{tp.nama} — {tp.keterangan}</div>
              <p className={`${tp.kelas} text-on-surface ${tp.nama === 'motto' ? 'italic' : ''}`}>{tp.contoh}</p>
            </div>
          ))}
        </div>
      </Bagian>

      <Bagian judul="Radius">
        <div className="flex flex-wrap gap-6">
          {RADIUS.map((r) => (
            <div key={r.nama} className="flex flex-col items-center gap-2">
              <div className={`w-24 h-24 bg-secondary-container border border-outline ${r.kelas}`} />
              <div className="font-label-md text-label-md text-xs">{r.kelas} = {r.nilai}</div>
            </div>
          ))}
        </div>
      </Bagian>

      <Bagian judul="Jarak (spacing)">
        <div className="flex flex-col gap-3">
          {SPACING.map((s) => (
            <div key={s.nama} className="flex items-center gap-4">
              <div className="font-label-md text-label-md text-xs w-40">{s.nama} = {s.nilai}</div>
              <div className={`h-4 bg-primary ${s.kelas} max-w-full`} />
            </div>
          ))}
        </div>
      </Bagian>

      <Bagian judul={`Ikon (${DAFTAR_IKON.length} nama, tiga ukuran + terisi)`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {DAFTAR_IKON.map((nama) => (
            <div key={nama} className="border border-outline-variant rounded p-2 bg-surface-container-lowest flex flex-col items-center gap-1">
              <div className="flex items-end gap-2 text-primary">
                <Ikon nama={nama} className="text-sm" />
                <Ikon nama={nama} />
                <Ikon nama={nama} className="text-3xl" />
                <Ikon nama={nama} terisi className="text-3xl text-secondary" />
              </div>
              <div className="font-label-md text-label-md text-[10px] text-on-surface-variant break-all text-center">{nama}</div>
            </div>
          ))}
        </div>
      </Bagian>

      <Bagian judul="Formulir contoh (plugin forms) — kelas dari kontak_pengaduan_warkop_nusantara_updated_logo/code.html">
        <form className="space-y-5 bg-surface-container-lowest p-6 rounded-lg border border-outline-variant">
          <div className="bg-surface-container-low p-4 rounded border border-outline-variant flex items-start gap-4">
            <div className="flex items-center h-5 mt-1">
              <input className="w-4 h-4 text-secondary bg-background border-outline rounded focus:ring-secondary focus:ring-2" id="anon-toggle" type="checkbox" />
            </div>
            <div className="text-sm">
              <label className="font-label-md text-label-md text-primary cursor-pointer" htmlFor="anon-toggle">Sembunyikan Identitas Saya (Laporan Anonim)</label>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Pilih opsi ini jika Anda merasa terancam. Kami menyarankan untuk tetap memberikan kontak agar kami dapat meminta klarifikasi lebih lanjut (kontak akan dirahasiakan).</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-input-focus border-b border-outline-variant transition-colors">
              <label className="font-label-md text-label-md text-primary block mb-1" htmlFor="uji-nama">Nama Lengkap (Sesuai KTP)</label>
              <input id="uji-nama" className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0" placeholder="Masukkan nama lengkap" type="text" />
            </div>
            <div className="form-input-focus border-b border-outline-variant transition-colors">
              <label className="font-label-md text-label-md text-primary block mb-1" htmlFor="uji-kategori">Kategori Masalah</label>
              <select id="uji-kategori" defaultValue="" className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0 appearance-none cursor-pointer">
                <option disabled value="">Pilih Kategori...</option>
                <option value="korupsi">Tindak Pidana Korupsi</option>
                <option value="pelayanan-publik">Buruknya Pelayanan Publik</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>
          <div className="form-input-focus border-b border-outline-variant transition-colors">
            <label className="font-label-md text-label-md text-primary block mb-2" htmlFor="uji-deskripsi">Deskripsi Lengkap Kejadian</label>
            <textarea id="uji-deskripsi" className="w-full bg-transparent border border-outline-variant rounded p-3 focus:border-secondary focus:ring-0 font-body-md text-body-md text-on-surface" placeholder="Ceritakan kronologi kejadian secara detail: Siapa yang terlibat? Kapan terjadinya? Bagaimana situasinya?" rows="5" />
          </div>
        </form>
      </Bagian>
    </main>
  );
}
