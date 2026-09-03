// POST /api/staf/pengguna/[id]/reset-sandi — superadmin SAJA. Body: { kata_sandi_baru }.
// Menyetel hash baru + wajib_ganti_sandi=1 (pengguna dipaksa mengganti saat login berikutnya lewat
// /staf/ganti-sandi) + token_version naik (sesi lama batal). Kata sandi tidak pernah dicatat di audit.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilUser, setelUlangSandiOlehAdmin } from '@/lib/db/users';
import { validasiKataSandi, GalatValidasiPengguna } from '@/lib/validasi/pengguna';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const POST = denganPeran(HAK.pengguna_kelola, async (request, { params }, pengguna) => {
  const { id } = await params; const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  const u = await ambilUser(n);
  if (!u) throw new GalatHttp(404, 'Pengguna tidak ditemukan', 'TIDAK_DITEMUKAN');
  const body = await bacaJson(request);
  let sandi;
  try { sandi = validasiKataSandi(body?.kata_sandi_baru ?? body?.kataSandiBaru, 'kata_sandi_baru'); } catch (g) { if (g instanceof GalatValidasiPengguna) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  await setelUlangSandiOlehAdmin(n, await bcrypt.hash(sandi, 12));
  await catatAudit({ userId: pengguna.id, aksi: 'pengguna_reset_sandi', tabelTerkait: 'users', idTerkait: n, detail: { wajibGanti: true }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengguna: await ambilUser(n), wajibGantiSandi: true }, { headers: { 'cache-control': 'no-store' } });
});
