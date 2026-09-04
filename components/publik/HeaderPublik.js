// components/publik/HeaderPublik.js — NAVBAR KANONIK (REFERENSI 18.3), server component.
// Markup verbatim = header kontak_pengaduan_warkop_nusantara_updated_logo + kotak cari beranda.
// Bagian yang butuh keadaan peramban (tautan aktif via usePathname, laci hamburger) ada di NavPublik (client).
//
// QA-3 C (KEPUTUSAN PEMILIK, menyimpang dari desain): tombol "Masuk Staff" DIHAPUS dari situs publik,
// sehingga komponen ini tidak lagi perlu membaca STAF_HOST. Halaman masuk tetap ada dan berfungsi lewat
// URL langsung ke host staf; alamatnya sengaja TIDAK disebut di mana pun pada situs publik.
import { menuPublik } from '@/lib/navItems';
import NavPublik from './NavPublik';

export default function HeaderPublik() {
  return <NavPublik menu={menuPublik} />;
}
