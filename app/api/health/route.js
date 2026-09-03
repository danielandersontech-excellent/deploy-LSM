// GET /api/health — status aplikasi + koneksi basis data.
// 200 bila DB terhubung, 503 bila terputus. Healthcheck yang selalu 200 tidak
// memeriksa apa pun (cetak biru bagian 6 catatan 2).
import { NextResponse } from 'next/server';
import { periksaKoneksi } from '@/lib/db';
import { waktuISOWIB } from '@/lib/utils';
import paket from '@/package.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const terhubung = await periksaKoneksi();
  const muatan = {
    status: terhubung ? 'sehat' : 'terganggu',
    waktu: waktuISOWIB(),
    basisData: terhubung ? 'terhubung' : 'terputus',
    versi: paket.version,
  };
  return NextResponse.json(muatan, {
    status: terhubung ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
