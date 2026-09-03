// /api/staf/pengurus — GET daftar (konten_lihat: redaktur, superadmin, pimpinan_wilayah baca-saja),
// POST buat (konten_kelola: redaktur, superadmin). Validasi lib/validasi/konten.js, audit setiap tulis.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilSemuaPengurus, buatPengurus, ambilPengurus } from '@/lib/db/pengurus';
import { validasiPengurus, GalatValidasiKonten } from '@/lib/validasi/konten';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.konten_lihat, async () => {
  const baris = await ambilSemuaPengurus();
  return NextResponse.json({ baris, total: baris.length }, { headers: { 'cache-control': 'no-store' } });
});

export const POST = denganPeran(HAK.konten_kelola, async (request, _konteks, pengguna) => {
  const body = await bacaJson(request);
  let m;
  try { m = validasiPengurus(body); } catch (g) { if (g instanceof GalatValidasiKonten) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  const id = await buatPengurus(m);
  await catatAudit({ userId: pengguna.id, aksi: 'pengurus_buat', tabelTerkait: 'pengurus', idTerkait: id, detail: { nama: m.nama }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengurus: await ambilPengurus(id) }, { status: 201, headers: { 'cache-control': 'no-store' } });
});
