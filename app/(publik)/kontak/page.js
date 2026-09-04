// app/(publik)/kontak/page.js — KONTAK & PENGADUAN. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari kontak_pengaduan_warkop_nusantara_updated_logo/code.html
// (screen.png 1067 px). Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) gambar peta ->
// next/image /logo-warkop-besar.png (tidak ada berkas peta — KEPUTUSAN BARU), (c) "Lihat Peta Penuh" ->
// /struktur#regional, (d) alamat/hotline/email -> tabel pengaturan; opsi kategori -> KATEGORI_PENGADUAN;
// wilayah -> ambilProvinsi(), (f) JSX. Navbar/footer dari layout (18.3).
// Panel kanan (formulir + keadaan konfirmasi) = components/publik/FormulirPengaduan.js (client);
// token formulir dibuat DI SINI (server) dan diteruskan sebagai prop (TAHAP-06 §11).
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import FormulirPengaduan from '@/components/publik/FormulirPengaduan';
import { buatTokenFormulir } from '@/lib/tokenFormulir';
import { ambilProvinsi } from '@/lib/db/wilayah';
import { ambilPengaturan } from '@/lib/db/pengaturan';
import { KATEGORI_PENGADUAN } from '@/lib/kategoriPengaduan';

export const metadata = {
  title: 'Kontak & Pengaduan',
  description:
    'Pusat Layanan Pengaduan Masyarakat WARKOP NUSANTARA: sampaikan laporan dugaan korupsi, pelayanan publik, agraria, infrastruktur, dan lingkungan, bisa anonim, identitas pelapor dilindungi.',
  alternates: { canonical: '/kontak' },
};

export default async function HalamanKontak() {
  const [provinsi, pengaturan] = await Promise.all([
    ambilProvinsi(),
    ambilPengaturan(['kontak_email', 'kontak_hotline', 'kontak_alamat_gedung', 'kontak_alamat_jalan', 'kontak_alamat_kota']),
  ]);
  const tokenFormulir = buatTokenFormulir();
  const kategori = KATEGORI_PENGADUAN.map((k) => ({ slug: k.slug, label: k.label }));
  const daftarProvinsi = provinsi.map((w) => ({ id: Number(w.id), nama: w.nama }));

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Header Section */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Pusat Layanan Pengaduan Masyarakat</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Kami siap mendengarkan, mencatat, dan menindaklanjuti setiap laporan Anda demi terciptanya transparansi dan keadilan.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Side: Contact Details & Map */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contact Info Card */}
          <div className="bg-surface-container-lowest border border-tertiary p-6 rounded-lg pressed-paper-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity" aria-hidden="true">
              <Ikon nama="contact_support" className="text-[120px]" />
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-6 flex items-center gap-2 border-b border-outline-variant pb-3">
              <Ikon nama="contact_phone" />
              Hubungi Kami
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-surface-container-high p-2 rounded text-primary">
                  <Ikon nama="location_on" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary mb-1">Kantor Pusat</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{pengaturan.kontak_alamat_gedung}<br />{pengaturan.kontak_alamat_jalan}<br />{pengaturan.kontak_alamat_kota}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-surface-container-high p-2 rounded text-primary">
                  <Ikon nama="call" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary mb-1">Hotline Pengaduan (24/7)</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{pengaturan.kontak_hotline}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-surface-container-high p-2 rounded text-primary">
                  <Ikon nama="mail" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-primary mb-1">Email Resmi</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{pengaturan.kontak_email}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Regional Office Map Placeholder */}
          <div className="bg-surface-container-lowest border border-tertiary p-6 rounded-lg pressed-paper-shadow">
            <h3 className="font-label-md text-label-md text-primary mb-4 flex items-center gap-2">
              <Ikon nama="map" />
              Kantor Regional
            </h3>
            <div className="w-full h-48 bg-surface-variant rounded flex items-center justify-center text-on-surface-variant relative overflow-hidden group">
              <Image alt="Peta kantor regional WARKOP NUSANTARA" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale contrast-125" src="/penampung/peta-penampung.jpg" fill sizes="(min-width: 1024px) 33vw, 100vw" />
              <div className="absolute inset-0 bg-primary opacity-20 mix-blend-multiply"></div>
              <Link className="relative z-10 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-semibold shadow flex items-center gap-1" href="/struktur#regional">
                <Ikon nama="explore" className="text-[14px]" /> Lihat Peta Penuh
              </Link>
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
        {/* Right Side: Complaint Form */}
        <FormulirPengaduan tokenFormulir={tokenFormulir} provinsi={daftarProvinsi} kategori={kategori} />
      </div>
    </main>
  );
}
