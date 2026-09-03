// app/not-found.js — halaman 404 beridentitas visual WARKOP (TAHAP-04 bagian 7).
// Tidak digambar Stitch -> KEPUTUSAN BARU (REFERENSI 18.4): cetakan kartu konfirmasi
// kontak_pengaduan_..._updated_logo / kartu login (bg-surface-container-lowest, border-outline-variant,
// rounded-lg, paper-shadow), kepala bg-primary, tombol varian 'primer' beranda.
// Halaman ini diprarender statis — TIDAK membaca basis data, jadi tidak memakai layout (publik).
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';

export const metadata = { title: 'Halaman tidak ditemukan' };

export default function TidakDitemukan() {
  return (
    <main id="konten-utama" className="flex-grow bg-background text-on-background flex items-center justify-center p-4 w-full">
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden z-0" aria-hidden="true">
        <Image className="watermark w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] object-contain" src="/logo-warkop-besar.png" alt="" width={1024} height={1024} />
      </div>
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden">
        <div className="bg-primary px-6 py-4 flex flex-col items-center justify-center border-b border-outline-variant">
          <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">WARKOP NUSANTARA</h1>
          <p className="font-label-md text-label-md text-secondary-fixed mt-1">Halaman tidak ditemukan</p>
        </div>
        <div className="p-8 text-center">
          <Ikon nama="explore" className="text-4xl text-primary mb-2" />
          <h2 className="font-headline-md text-headline-md text-primary">404</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Halaman yang Anda cari tidak ada, sudah dipindahkan, atau alamatnya salah ketik.</p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Link href="/" className={KELAS_TOMBOL.primer}>
              <Ikon nama="explore" />
              Kembali ke Beranda
            </Link>
            <Link href="/kontak" className={KELAS_TOMBOL.garis}>
              <Ikon nama="campaign" />
              Sampaikan Pengaduan
            </Link>
          </div>
        </div>
        <div className="bg-surface-container-low px-6 py-4 text-center border-t border-outline-variant">
          <p className="font-motto text-motto text-primary">&quot;Berani Karena Benar&quot;</p>
        </div>
      </div>
    </main>
  );
}
