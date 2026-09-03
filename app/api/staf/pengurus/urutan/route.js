// PATCH /api/staf/pengurus/urutan — simpan urutan tampil (konten_kelola). Body: { urutan: [id, id, …] }.
// Urutan menentukan tampilan /struktur (ambilPengurusAktif ORDER BY urutan) — langsung terlihat.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { simpanUrutanPengurus, ambilSemuaPengurus } from '@/lib/db/pengurus';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const PATCH = denganPeran(HAK.konten_kelola, async (request, _k, pengguna) => {
  const body = await bacaJson(request);
  const daftar = Array.isArray(body?.urutan) ? body.urutan.map(Number) : null;
  if (!daftar || daftar.length === 0 || daftar.some((n) => !Number.isInteger(n) || n <= 0) || new Set(daftar).size !== daftar.length) {
    throw new GalatHttp(422, 'urutan harus daftar id pengurus yang unik', 'URUTAN_TIDAK_SAH');
  }
  const ada = new Set((await ambilSemuaPengurus()).map((p) => p.id));
  const asing = daftar.filter((n) => !ada.has(n));
  if (asing.length) throw new GalatHttp(422, `id tidak dikenal: ${asing.join(', ')}`, 'ID_TIDAK_DIKENAL');
  const n = await simpanUrutanPengurus(daftar);
  await catatAudit({ userId: pengguna.id, aksi: 'pengurus_urutan', tabelTerkait: 'pengurus', idTerkait: null, detail: { jumlah: n }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ tersimpan: n, baris: await ambilSemuaPengurus() }, { headers: { 'cache-control': 'no-store' } });
});
