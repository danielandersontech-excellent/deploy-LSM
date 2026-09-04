// components/publik/FooterPublik.js — FOOTER KANONIK (REFERENSI 18.3), server component.
// Markup verbatim = footer beranda_warkop_nusantara/code.html dengan logo segel h-12.
// Perubahan 18.2: (a) ikon -> <Ikon>, (b) img -> next/image lokal, (c) href="#" -> rute,
// (d) tahun, email, hotline dinamis (aturan turunan 18.3), (f) JSX.
//
// RUN QA-3 D + E (KEPUTUSAN PEMILIK, menyimpang dari desain):
//   D1. Latar cokelat footer MEMBENTANG PENUH sampai tepi layar (seperti header). Caranya: kelas latar +
//       border pindah ke <footer> yang w-full, sedangkan kelas kontainer (max-w-container-max mx-auto,
//       padding, flex) pindah ke <div> di dalamnya. Tidak ada kelas desain yang dibuang, hanya dipisah.
//   D2. Tautan cepat "Kantor Regional" menjadi "Kantor Pusat": membuka TAB BARU ke petunjuk arah Google
//       Maps menuju titik kantor pusat. Alamat tautannya disimpan sebagai pengaturan `kontak_peta_url`
//       (K3: bisa diubah lewat ruang staf; dikosongkan = tautannya tidak dirender).
//   E.  Ikon media sosial hanya untuk kanal yang URL-nya TERISI (pengaturan sosial_*), tab baru,
//       rel="noopener noreferrer". Ikonnya SVG buatan sendiri (components/publik/IkonSosial.js), bukan
//       logo resmi yang disalin dan bukan unduhan dari internet (aturan K1).
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import { ambilPengaturan } from '@/lib/db/pengaturan';
import IkonSosial, { KANAL_SOSIAL } from './IkonSosial';

const TAUTAN_CEPAT = [
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
  { label: 'Pedoman Komunitas', href: '/pedoman-komunitas' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Kontak Media', href: '/kontak' },
];

export default async function FooterPublik() {
  const setelan = await ambilPengaturan([
    'kontak_email', 'kontak_hotline', 'kontak_alamat_gedung', 'kontak_alamat_jalan', 'kontak_alamat_kota',
    'kontak_peta_url', ...KANAL_SOSIAL.map((k) => k.kunci),
  ]);
  const tahun = new Date().getFullYear();
  const petaUrl = (setelan.kontak_peta_url || '').trim();
  const sosialTerisi = KANAL_SOSIAL.map((k) => ({ ...k, url: (setelan[k.kunci] || '').trim() })).filter((k) => k.url);
  return (
    // D1: latar + garis di elemen luar (membentang penuh), kontainer isi di dalam.
    <footer className="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container w-full border-t border-outline flat">
    <div className="px-margin-mobile md:px-margin-desktop py-12 flex flex-col md:flex-row justify-between items-start gap-gutter max-w-container-max mx-auto">
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <div className="font-headline-md text-headline-md text-secondary-fixed flex items-center gap-2">
          <Image src="/logo-warkop.png" alt="Warkop Nusantara Logo" className="h-12 w-12 object-contain rounded-full" width={48} height={48} />
          <span className="">WARKOP NUSANTARA</span>
        </div>
        <p className="font-motto text-motto text-on-primary/90 mt-2">
          © {tahun} Warkop Nusantara. Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara. Berani Karena Benar.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-12 w-full md:w-auto mt-8 md:mt-0">
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-label-md text-secondary-fixed mb-2 uppercase tracking-wider">Tautan Cepat</h4>
          {petaUrl ? (
            // D2: petunjuk arah ke kantor pusat, tab baru + rel noopener (kelas sama dengan tautan cepat lain)
            <a className="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href={petaUrl} target="_blank" rel="noopener noreferrer">Kantor Pusat</a>
          ) : null}
          {TAUTAN_CEPAT.map((t) => (
            <Link key={t.href} className="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href={t.href}>{t.label}</Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-label-md text-secondary-fixed mb-2 uppercase tracking-wider">Hubungi Kami</h4>
          <p className="font-body-md text-body-md text-surface-variant flex items-center gap-2">
            <Ikon nama="mail" className="text-sm" />
            {setelan.kontak_email}
          </p>
          <p className="font-body-md text-body-md text-surface-variant flex items-center gap-2">
            <Ikon nama="call" className="text-sm" />
            {setelan.kontak_hotline}
          </p>
          {/* QA-2 A1/B3: alamat resmi dari pengaturan (kelas sama dengan baris email/hotline desain) */}
          <p className="font-body-md text-body-md text-surface-variant flex items-start gap-2 max-w-xs">
            <Ikon nama="location_on" className="text-sm mt-1" />
            <span>{setelan.kontak_alamat_gedung}, {setelan.kontak_alamat_jalan}, {setelan.kontak_alamat_kota}</span>
          </p>
          {sosialTerisi.length ? (
            <div className="flex items-center gap-3 mt-2">
              {sosialTerisi.map((k) => (
                <a
                  key={k.kunci}
                  href={k.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${k.label} WARKOP NUSANTARA (tab baru)`}
                  title={k.label}
                  className="text-surface-variant hover:text-on-primary transition-colors duration-300"
                >
                  <IkonSosial nama={k.nama} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </footer>
  );
}
