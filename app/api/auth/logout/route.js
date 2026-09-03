// POST /api/auth/logout — hapus cookie sesi, tulis audit_log.
import { NextResponse } from 'next/server';
import { ambilPenggunaSesi, NAMA_COOKIE, opsiHapusCookieSesi, alamatIpPermintaan } from '@/lib/auth/sesi';
import { catatAudit } from '@/lib/db/audit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const pengguna = await ambilPenggunaSesi();
  if (pengguna) {
    await catatAudit({ userId: pengguna.id, aksi: 'logout', tabelTerkait: 'users', idTerkait: pengguna.id, ip: await alamatIpPermintaan(request) });
  }
  const balasan = NextResponse.json({ keluar: true }, { headers: { 'cache-control': 'no-store' } });
  balasan.cookies.set(NAMA_COOKIE, '', opsiHapusCookieSesi(request));
  return balasan;
}
