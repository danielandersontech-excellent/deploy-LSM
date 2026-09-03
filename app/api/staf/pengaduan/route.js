// GET /api/staf/pengaduan — daftar pengaduan untuk staf (verifikator, superadmin, pimpinan_wilayah).
// Identitas pelapor hanya untuk peran di HAK.pengaduan_identitas (dihitung dari peran, diteruskan ke SQL).
// pimpinan_wilayah: wilayah_id WAJIB diteruskan ke lib/db (disaring di WHERE).
import { NextResponse } from 'next/server';
import { denganPeran } from '@/lib/auth/penjaga';
import { HAK, bolehLihatIdentitas, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { daftarPengaduan, hitungPengaduanPerStatus } from '@/lib/db/pengaduan';
import { SLUG_STATUS_PENGADUAN, kategoriPengaduanValid } from '@/lib/kategoriPengaduan';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.pengaduan_lihat, async (request, _konteks, pengguna) => {
  const sp = request.nextUrl.searchParams;
  const status = sp.get('status');
  const kategori = sp.get('kategori');
  const wilayahId = wilayahTerbatas(pengguna);
  const [hasil, perStatus] = await Promise.all([
    daftarPengaduan({
      status: SLUG_STATUS_PENGADUAN.includes(status) ? status : null,
      kategori: kategoriPengaduanValid(kategori) ? kategori : null,
      q: (sp.get('q') || '').slice(0, 100) || null,
      wilayahId,
      bolehLihatIdentitas: bolehLihatIdentitas(pengguna.peran),
      halaman: sp.get('halaman'),
      perHalaman: sp.get('perHalaman'),
    }),
    hitungPengaduanPerStatus({ wilayahId }),
  ]);
  return NextResponse.json({ ...hasil, perStatus }, { headers: { 'cache-control': 'no-store' } });
});
