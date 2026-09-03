// app/sitemap.js — peta situs: halaman publik statis + artikel terbit (Tahap 5 menambah slug).
// Dibangkitkan saat permintaan (force-dynamic) karena membaca basis data — tidak boleh
// dijalankan saat `next build` di dalam image Docker (tidak ada DB di sana).
import { ambilArtikelTerbit } from '@/lib/db/artikel';

export const dynamic = 'force-dynamic';

const HALAMAN_STATIS = [
  { jalur: '/', prioritas: 1.0, frekuensi: 'daily' },
  { jalur: '/tentang', prioritas: 0.7, frekuensi: 'monthly' },
  { jalur: '/struktur', prioritas: 0.6, frekuensi: 'monthly' },
  { jalur: '/program', prioritas: 0.7, frekuensi: 'weekly' },
  { jalur: '/galeri', prioritas: 0.6, frekuensi: 'weekly' },
  { jalur: '/berita', prioritas: 0.9, frekuensi: 'daily' },
  { jalur: '/kontak', prioritas: 0.8, frekuensi: 'monthly' },
  { jalur: '/lacak', prioritas: 0.5, frekuensi: 'monthly' },
  { jalur: '/kebijakan-privasi', prioritas: 0.3, frekuensi: 'yearly' },
  { jalur: '/pedoman-komunitas', prioritas: 0.3, frekuensi: 'yearly' },
  { jalur: '/faq', prioritas: 0.4, frekuensi: 'yearly' },
];

export default async function sitemap() {
  const dasar = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const sekarang = new Date();
  const statis = HALAMAN_STATIS.map((h) => ({ url: `${dasar}${h.jalur}`, lastModified: sekarang, changeFrequency: h.frekuensi, priority: h.prioritas }));
  let artikel = [];
  try {
    const { baris } = await ambilArtikelTerbit({ halaman: 1, perHalaman: 50 });
    artikel = baris.map((a) => ({
      url: `${dasar}/berita/${a.slug}`,
      lastModified: a.diperbarui_pada instanceof Date ? a.diperbarui_pada : sekarang,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    // Basis data tidak terjangkau: peta situs statis tetap diberikan.
  }
  return [...statis, ...artikel];
}
