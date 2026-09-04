// app/(staf)/staf/program/page.js — Kelola Program (staf). Layar ini TIDAK ada di ZIP ->
// KEPUTUSAN BARU (REFERENSI 18.4): cetakan kelola_artikel_admin/code.html (header halaman + tabel)
// dan editor_artikel_admin/code.html (formulir tambah/ubah). Server component: memuat data lewat
// lib/db (tanpa SQL di halaman) lalu merender SATU client component components/staf/KelolaProgram.js.
// Sidebar kanonik + <main> dirender app/(staf)/staf/layout.js; halaman hanya mengembalikan isi <main>.
//
// Hak (lib/auth/hakAkses.js): HAK.konten_lihat (superadmin, redaktur, pimpinan_wilayah) boleh membuka;
// HAK.konten_kelola (superadmin, redaktur) boleh tambah/ubah/hapus; pimpinan_wilayah baca-saja;
// peran lain (penulis, verifikator) -> /tanpa-akses. Pagar utama tetap requireRole di /api/staf/program.
// KEPUTUSAN BARU: program adalah konten publik (tidak berwilayah privat) -> pimpinan_wilayah melihat
// SELURUH daftar (ambilProgram tidak menyaring wilayah), sesuai brief `ambilProgram({perHalaman:50})`.
import { redirect } from 'next/navigation';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilProgram } from '@/lib/db/program';
import { ambilProvinsi } from '@/lib/db/wilayah';
import { STATUS_PROGRAM } from '@/lib/kategoriProgram';
import { ambilKategoriProgram } from '@/lib/db/kategoriProgram';
import KelolaProgram from '@/components/staf/KelolaProgram';

export const metadata = {
  title: 'Kelola Program',
  description: 'Daftar program dan kegiatan yang tampil di portal publik.',
};
export const dynamic = 'force-dynamic';

/**
 * Kolom DATE dari mysql2 tiba sebagai Date (pool timezone +07:00 -> tengah malam WIB = 17:00Z hari
 * sebelumnya). Digeser +7 jam lalu dibaca sebagai UTC agar tanggal WIB tidak mundur satu hari —
 * TIDAK mempercayai zona waktu mesin. Hasil "YYYY-MM-DD" untuk <input type="date"> dan API.
 */
function keTanggalYMD(nilai) {
  if (!nilai) return null;
  if (nilai instanceof Date) {
    const w = new Date(nilai.getTime() + 7 * 60 * 60 * 1000);
    const d = (n) => String(n).padStart(2, '0');
    return `${w.getUTCFullYear()}-${d(w.getUTCMonth() + 1)}-${d(w.getUTCDate())}`;
  }
  const m = String(nilai).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export default async function HalamanKelolaProgram() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login?lanjut=%2Fstaf%2Fprogram');
  if (!HAK.konten_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const [{ baris, total }, provinsi, kategoriProgram] = await Promise.all([ambilProgram({ perHalaman: 50 }), ambilProvinsi(), ambilKategoriProgram()]);

  // Hanya kolom yang dibutuhkan klien; tanggal diseragamkan menjadi "YYYY-MM-DD" (serialisasi ke client component).
  const program = baris.map((p) => ({
    id: p.id,
    judul: p.judul,
    slug: p.slug,
    ringkasan: p.ringkasan ?? '',
    isi: p.isi ?? '',
    gambar: p.gambar ?? null,
    kategori: p.kategori,
    status: p.status,
    wilayah_id: p.wilayah_id ?? null,
    wilayah_nama: p.wilayah_nama ?? null,
    mulai_pada: keTanggalYMD(p.mulai_pada),
    selesai_pada: keTanggalYMD(p.selesai_pada),
  }));

  return (
    <KelolaProgram
      program={program}
      total={total}
      provinsi={provinsi.map((w) => ({ id: w.id, nama: w.nama }))}
      kategori={kategoriProgram.map((k) => ({ slug: k.slug, label: k.nama }))}
      daftarStatus={STATUS_PROGRAM.map((s) => ({ slug: s.slug, label: s.label }))}
      bolehKelola={HAK.konten_kelola.includes(pengguna.peran)}
      dasarUrlPublik={(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}
    />
  );
}
