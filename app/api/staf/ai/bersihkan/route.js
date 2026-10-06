// POST /api/staf/ai/bersihkan — "Bersihkan sekarang" (RUN AI-1 butir C). Peran HAK.pengaturan_kelola (superadmin saja).
// Saran 'baru' > 7 hari: berkas gambar dihapus + status 'dibersihkan'. Artikel jadi dan saran 'dipakai' tidak disentuh.
import { NextResponse } from 'next/server';
import { denganPeran } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { bersihkanSaranKadaluarsa, HARI_KADALUARSA } from '@/lib/ai/pembersihan';

export const dynamic = 'force-dynamic';

export const POST = denganPeran(HAK.pengaturan_kelola, async (request, _konteks, pengguna) => {
  const hasil = await bersihkanSaranKadaluarsa();
  await catatAudit({ userId: pengguna.id, aksi: 'ai_saran_bersihkan', tabelTerkait: 'ai_saran', idTerkait: null,
    detail: { ...hasil, hari: HARI_KADALUARSA }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ ...hasil, hari: HARI_KADALUARSA }, { headers: { 'cache-control': 'no-store' } });
});
