'use client';
// components/staf/SidebarStaf.js — SIDEBAR STAF KANONIK (REFERENSI 18.3): markup verbatim <nav> dari
// dashboard_staff_warkop/code.html; layar staf lain memakai sidebar yang SAMA.
// Enam perubahan 18.2: (a) ikon -> <Ikon> (item aktif `terisi` seperti style FILL 1 di desain),
// (b) avatar googleusercontent -> logo lokal, (c) href="#" -> lib/navItems.js menuUntukPeran,
// (d) "Staff Warkop"/"Vigilance Officer" -> nama & label peran pengguna, (e) item menu .map(), (f) JSX.
// KEPUTUSAN BARU: `h-screen` (=100vh, aturan 5) diganti `h-dvh`; di bawah md sidebar menjadi laci
// (tombol hamburger di TopbarStaf) — desain hanya menggambar desktop. "Buat Laporan Baru" ->
// /staf/artikel/baru untuk peran artikel_buat, /staf/pengaduan untuk verifikator (tidak ada bagi
// pimpinan_wilayah, baca-saja). "Keluar" = POST /api/auth/logout lalu ke /login.
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';

const KELAS_AKTIF = 'bg-secondary-container text-on-secondary-container font-semibold rounded-lg mx-2 px-4 py-3 flex items-center gap-3 scale-95 duration-100';
const KELAS_PASIF = 'text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container rounded-lg mx-2 px-4 py-3 flex items-center gap-3 transition-colors mt-1';

export const LABEL_PERAN = Object.freeze({
  superadmin: 'Superadmin',
  redaktur: 'Redaktur',
  penulis: 'Penulis',
  verifikator: 'Verifikator',
  pimpinan_wilayah: 'Pimpinan Wilayah',
});

export default function SidebarStaf({ pengguna, menu, hrefAksiUtama = null, labelAksiUtama = 'Buat Laporan Baru', terbuka = false, onTutup }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);
  const aktif = (href) => pathname === href || pathname.startsWith(`${href}/`);
  // Menu utama = semua item kecuali Pengaturan (yang di desain ada di bagian bawah)
  const utama = menu.filter((m) => m.href !== '/staf/pengaturan');
  const pengaturan = menu.find((m) => m.href === '/staf/pengaturan');

  async function logout() {
    if (keluar) return;
    setKeluar(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <nav
      className={`bg-surface-container-low dark:bg-surface-container-lowest docked left-0 h-full w-64 border-r border-outline-variant fixed left-0 top-0 h-dvh flex-col py-6 space-y-4 z-50 ${terbuka ? 'flex' : 'hidden'} md:flex`}
      aria-label="Navigasi staf"
    >
      {/* Brand / Header */}
      <div className="px-6 pb-4 border-b border-outline-variant flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
          <Image alt="" className="w-full h-full object-cover" src="/logo-warkop.png" width={40} height={40} />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-primary leading-tight">{pengguna.nama}</h1>
          <p className="font-label-md text-label-md text-on-surface-variant">{LABEL_PERAN[pengguna.peran] ?? pengguna.peran}</p>
        </div>
      </div>
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto pt-2">
        {utama.map((item) => (
          <Link key={item.href} className={aktif(item.href) ? KELAS_AKTIF : KELAS_PASIF} href={item.href} aria-current={aktif(item.href) ? 'page' : undefined} onClick={onTutup}>
            <Ikon nama={item.ikon} terisi={aktif(item.href)} />
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        ))}
      </div>
      {/* CTA & Footer Tabs */}
      <div className="px-4 pb-4">
        {hrefAksiUtama ? (
          <Link href={hrefAksiUtama} className="w-full bg-primary text-on-primary rounded-lg py-2 mb-4 font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm block text-center" style={{ boxShadow: '0 2px 4px rgba(115,92,0,0.15)' }} onClick={onTutup}>
            {labelAksiUtama}
          </Link>
        ) : null}
        {pengaturan ? (
          <Link className={`text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container rounded-lg px-4 py-2 flex items-center gap-3 transition-colors${aktif(pengaturan.href) ? ' bg-secondary-container text-on-secondary-container font-semibold' : ''}`} href={pengaturan.href} aria-current={aktif(pengaturan.href) ? 'page' : undefined} onClick={onTutup}>
            <Ikon nama={pengaturan.ikon} terisi={aktif(pengaturan.href)} />
            <span className="font-label-md text-label-md">{pengaturan.label}</span>
          </Link>
        ) : null}
        <button type="button" className="text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container rounded-lg px-4 py-2 flex items-center gap-3 transition-colors mt-1 w-full" onClick={logout} disabled={keluar}>
          <Ikon nama="logout" />
          <span className="font-label-md text-label-md">{keluar ? 'Keluar…' : 'Keluar'}</span>
        </button>
      </div>
    </nav>
  );
}
