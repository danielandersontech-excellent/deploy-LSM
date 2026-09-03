'use client';
// app/error.js — batas galat beridentitas visual WARKOP (TAHAP-04 bagian 7). Client component
// (syarat Next.js). KEPUTUSAN BARU (REFERENSI 18.4): cetakan kartu login/kontak seperti not-found.
// Pesan galat teknis TIDAK ditampilkan ke publik (bisa memuat detail server); hanya digest.
import { useEffect } from 'react';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';

export default function Galat({ error, reset }) {
  useEffect(() => {
    // Dicatat di konsol peramban saja; log server sudah mencatat galat aslinya.
    console.error('[warkop] galat halaman:', error?.digest ?? error?.message);
  }, [error]);

  return (
    <main id="konten-utama" className="flex-grow bg-background text-on-background flex items-center justify-center p-4 w-full">
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden">
        <div className="bg-primary px-6 py-4 flex flex-col items-center justify-center border-b border-outline-variant">
          <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">WARKOP NUSANTARA</h1>
          <p className="font-label-md text-label-md text-secondary-fixed mt-1">Terjadi gangguan</p>
        </div>
        <div className="p-8 text-center">
          <Ikon nama="warning" terisi className="text-4xl text-on-error-container mb-2" />
          <h2 className="font-headline-md text-headline-md text-primary">Halaman tidak dapat dimuat</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Sistem mengalami gangguan sementara. Silakan coba lagi beberapa saat; bila berulang, hubungi kami lewat halaman Kontak.
          </p>
          {error?.digest ? <p className="font-label-md text-xs text-on-surface-variant mt-4">Kode: {error.digest}</p> : null}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <button type="button" onClick={() => reset()} className={KELAS_TOMBOL.primer}>
              <Ikon nama="update" />
              Coba Lagi
            </button>
            <Link href="/" className={KELAS_TOMBOL.garis}>
              <Ikon nama="explore" />
              Ke Beranda
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
