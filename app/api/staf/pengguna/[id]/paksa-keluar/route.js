// POST /api/staf/pengguna/[id]/paksa-keluar — superadmin SAJA. Menaikkan token_version sehingga SELURUH
// token lama pengguna itu batal seketika (ambilPenggunaSesi membandingkan token_version di setiap permintaan).
// Berguna saat akun diduga dibobol. Boleh dipakai pada diri sendiri (mengeluarkan semua sesi sendiri).
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilUser, naikkanTokenVersion } from '@/lib/db/users';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const POST = denganPeran(HAK.pengguna_kelola, async (request, { params }, pengguna) => {
  const { id } = await params; const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  const u = await ambilUser(n);
  if (!u) throw new GalatHttp(404, 'Pengguna tidak ditemukan', 'TIDAK_DITEMUKAN');
  await naikkanTokenVersion(n);
  await catatAudit({ userId: pengguna.id, aksi: 'pengguna_paksa_keluar', tabelTerkait: 'users', idTerkait: n, detail: { tokenVersionSebelum: u.token_version }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengguna: await ambilUser(n), dipaksaKeluar: true }, { headers: { 'cache-control': 'no-store' } });
});
