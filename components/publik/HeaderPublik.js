// components/publik/HeaderPublik.js — NAVBAR KANONIK (REFERENSI 18.3), server component.
// Markup verbatim = header kontak_pengaduan_warkop_nusantara_updated_logo + kotak cari beranda.
// Bagian yang butuh keadaan peramban (tautan aktif via usePathname, laci hamburger)
// ada di NavPublik (client). Server component ini hanya membaca STAF_HOST.
import { menuPublik } from '@/lib/navItems';
import NavPublik from './NavPublik';

export default function HeaderPublik() {
  const stafHost = (process.env.STAF_HOST || '').trim();
  // "Masuk Staff" -> https://<STAF_HOST>/login; bila STAF_HOST kosong (lokal) -> /login
  const hrefStaf = stafHost ? `https://${stafHost}/login` : '/login';
  return <NavPublik menu={menuPublik} hrefStaf={hrefStaf} />;
}
