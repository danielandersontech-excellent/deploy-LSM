'use client';
// components/staf/KerangkaStaf.js — kerangka ruang staf (client, karena laci sidebar di layar kecil
// butuh keadaan). Struktur dari <body> dashboard_staff_warkop/code.html:
//   body: "flex h-screen overflow-hidden"  ->  div "flex h-dvh overflow-hidden" (h-screen = 100vh, aturan 5)
//   <nav> sidebar kanonik (SidebarStaf) + <main class="flex-1 ml-64 h-full overflow-y-auto">
// KEPUTUSAN BARU: di bawah md, ml-64 dilepas (md:ml-64) dan ada bilah atas dengan tombol hamburger
// yang membuka sidebar sebagai laci + latar gelap; desain hanya menggambar desktop.
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import SidebarStaf from './SidebarStaf';

const JALUR_GANTI_SANDI = '/staf/ganti-sandi';

export default function KerangkaStaf({ pengguna, menu, hrefAksiUtama, labelAksiUtama, wajibGantiSandi = false, children }) {
  const [laci, setLaci] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Tahap 7: setelah reset kata sandi oleh superadmin, pengguna WAJIB mengganti sandi dulu —
  // seluruh halaman staf lain dialihkan ke /staf/ganti-sandi sampai selesai.
  useEffect(() => {
    if (wajibGantiSandi && pathname !== JALUR_GANTI_SANDI) router.replace(JALUR_GANTI_SANDI);
  }, [wajibGantiSandi, pathname, router]);
  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased overflow-hidden flex h-dvh w-full">
      <SidebarStaf pengguna={pengguna} menu={menu} hrefAksiUtama={hrefAksiUtama} labelAksiUtama={labelAksiUtama} terbuka={laci} onTutup={() => setLaci(false)} />
      {laci ? (
        <button type="button" className="fixed inset-0 z-40 bg-primary/60 md:hidden" aria-label="Tutup menu" onClick={() => setLaci(false)} />
      ) : null}
      <main className="flex-1 md:ml-64 h-full overflow-y-auto" id="konten-utama">
        {/* Bilah atas hanya di bawah md (KEPUTUSAN BARU) */}
        <div className="md:hidden flex items-center justify-between px-margin-mobile py-unit bg-primary text-on-primary border-b border-outline-variant sticky top-0 z-30">
          <span className="font-headline-md text-headline-md text-on-primary uppercase tracking-tight">WARKOP</span>
          <button type="button" className="flex items-center text-on-primary opacity-80 hover:opacity-100 transition-opacity" aria-label={laci ? 'Tutup menu' : 'Buka menu'} aria-expanded={laci} onClick={() => setLaci((v) => !v)}>
            <Ikon nama={laci ? 'close' : 'menu'} className="text-3xl" />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
