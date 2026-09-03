// /api/staf/program — GET daftar (konten_lihat), POST buat (konten_kelola). Slug otomatis unik (lib/db/program).
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilProgram, buatProgram, ambilProgramById } from '@/lib/db/program';
import { validasiProgram, GalatValidasiKonten } from '@/lib/validasi/konten';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.konten_lihat, async (request) => {
  const sp = request.nextUrl.searchParams;
  const hasil = await ambilProgram({ kategori: sp.get('kategori') || null, status: sp.get('status') || null, urut: sp.get('urut') || 'terbaru', halaman: sp.get('halaman'), perHalaman: sp.get('perHalaman') || 50 });
  return NextResponse.json(hasil, { headers: { 'cache-control': 'no-store' } });
});

export const POST = denganPeran(HAK.konten_kelola, async (request, _k, pengguna) => {
  const body = await bacaJson(request);
  let m;
  try { m = validasiProgram(body); } catch (g) { if (g instanceof GalatValidasiKonten) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  const id = await buatProgram(m);
  await catatAudit({ userId: pengguna.id, aksi: 'program_buat', tabelTerkait: 'program', idTerkait: id, detail: { judul: m.judul }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ program: await ambilProgramById(id) }, { status: 201, headers: { 'cache-control': 'no-store' } });
});
