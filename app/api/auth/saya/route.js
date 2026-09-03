// GET /api/auth/saya — identitas pengguna aktif (tanpa kata_sandi_hash). 401 bila belum masuk.
import { NextResponse } from 'next/server';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { balasGalat } from '@/lib/auth/penjaga';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) return balasGalat(401, 'Belum masuk', 'BELUM_MASUK');
  return NextResponse.json({ pengguna }, { headers: { 'cache-control': 'no-store' } });
}
