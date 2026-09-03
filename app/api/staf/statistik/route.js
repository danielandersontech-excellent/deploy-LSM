// GET /api/staf/statistik — angka dashboard, seluruh peran staf, disaring menurut peran di SQL.
import { NextResponse } from 'next/server';
import { denganPeran } from '@/lib/auth/penjaga';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { hitungStatistikDashboard, trenLaporanBulanan, pengaduanTerbaru } from '@/lib/db/statistik';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.statistik, async (_request, _konteks, pengguna) => {
  const wilayahId = wilayahTerbatas(pengguna);
  const [kartu, tren, terbaru] = await Promise.all([
    hitungStatistikDashboard({ peran: pengguna.peran, userId: pengguna.id, wilayahId }),
    trenLaporanBulanan({ bulan: 6, wilayahId }),
    HAK.pengaduan_lihat.includes(pengguna.peran) ? pengaduanTerbaru({ batas: 5, wilayahId }) : Promise.resolve([]),
  ]);
  return NextResponse.json({ kartu, tren, pengaduanTerbaru: terbaru }, { headers: { 'cache-control': 'no-store' } });
});
