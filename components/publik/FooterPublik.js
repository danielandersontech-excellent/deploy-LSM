// components/publik/FooterPublik.js — FOOTER KANONIK (REFERENSI 18.3), server component.
// Markup verbatim = footer beranda_warkop_nusantara/code.html dengan logo segel h-12.
// Perubahan 18.2: (a) ikon -> <Ikon>, (b) img -> next/image lokal, (c) href="#" -> rute,
// (d) tahun, email, hotline dinamis (aturan turunan 18.3), (f) JSX.
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import { ambilPengaturan } from '@/lib/db/pengaturan';

const TAUTAN_CEPAT = [
  { label: 'Kantor Regional', href: '/struktur#regional' },
  { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
  { label: 'Pedoman Komunitas', href: '/pedoman-komunitas' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Kontak Media', href: '/kontak' },
];

export default async function FooterPublik() {
  const setelan = await ambilPengaturan(['kontak_email', 'kontak_hotline', 'kontak_alamat_gedung', 'kontak_alamat_jalan', 'kontak_alamat_kota']);
  const tahun = new Date().getFullYear();
  return (
    <footer className="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container w-full px-margin-mobile md:px-margin-desktop py-12 flex flex-col md:flex-row justify-between items-start gap-gutter max-w-container-max mx-auto border-t border-outline flat">
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
        </div>
      </div>
    </footer>
  );
}
