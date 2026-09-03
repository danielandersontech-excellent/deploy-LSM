// /api/staf/program/[id] — GET (konten_lihat), PATCH & DELETE (konten_kelola). params di-await.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilProgramById, perbaruiProgram, hapusProgram } from '@/lib/db/program';
import { validasiProgram, GalatValidasiKonten } from '@/lib/validasi/konten';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

async function idDari(params) {
  const { id } = await params; const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  return n;
}

export const GET = denganPeran(HAK.konten_lihat, async (_r, { params }) => {
  const id = await idDari(params);
  const p = await ambilProgramById(id);
  if (!p) throw new GalatHttp(404, 'Program tidak ditemukan', 'TIDAK_DITEMUKAN');
  return NextResponse.json({ program: p }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.konten_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilProgramById(id);
  if (!lama) throw new GalatHttp(404, 'Program tidak ditemukan', 'TIDAK_DITEMUKAN');
  const body = await bacaJson(request);
  let m;
  try { m = validasiProgram({ ...lama, wilayah_id: lama.wilayah_id, mulai_pada: lama.mulai_pada, selesai_pada: lama.selesai_pada, ...body }); } catch (g) { if (g instanceof GalatValidasiKonten) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  await perbaruiProgram(id, m);
  await catatAudit({ userId: pengguna.id, aksi: 'program_ubah', tabelTerkait: 'program', idTerkait: id, detail: { judul: m.judul }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ program: await ambilProgramById(id) }, { headers: { 'cache-control': 'no-store' } });
});

export const DELETE = denganPeran(HAK.konten_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilProgramById(id);
  if (!lama) throw new GalatHttp(404, 'Program tidak ditemukan', 'TIDAK_DITEMUKAN');
  await hapusProgram(id);
  await catatAudit({ userId: pengguna.id, aksi: 'program_hapus', tabelTerkait: 'program', idTerkait: id, detail: { judul: lama.judul }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ dihapus: true, id }, { headers: { 'cache-control': 'no-store' } });
});
