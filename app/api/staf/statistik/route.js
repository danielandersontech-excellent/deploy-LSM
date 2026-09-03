// GET /api/staf/statistik — angka dashboard, seluruh peran staf, disaring menurut peran DI SQL.
// Tahap 7: tren 12 bulan (bulan kosong tetap 0), artikel terbaru (redaktur/penulis/pimpinan_wilayah),
// pengaduan terbaru (verifikator/superadmin/pimpinan_wilayah), aktivitas staf dari audit_log.
import { NextResponse } from 'next/server';
import { denganPeran } from '@/lib/auth/penjaga';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { hitungStatistikDashboard, trenLaporanBulanan, pengaduanTerbaru, artikelTerbaruDashboard } from '@/lib/db/statistik';
import { ambilAktivitasTerbaru } from '@/lib/db/audit';
import { jumlahSocket as ambilJumlahSocket } from '@/lib/socket/server';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.statistik, async (_request, _konteks, pengguna) => {
  const wilayahId = wilayahTerbatas(pengguna);
  const [kartu, tren, terbaru, artikel, aktivitas] = await Promise.all([
    hitungStatistikDashboard({ peran: pengguna.peran, userId: pengguna.id, wilayahId }),
    trenLaporanBulanan({ bulan: 12, wilayahId }),
    HAK.pengaduan_lihat.includes(pengguna.peran) ? pengaduanTerbaru({ batas: 5, wilayahId }) : Promise.resolve([]),
    HAK.artikel_lihat.includes(pengguna.peran) ? artikelTerbaruDashboard({ peran: pengguna.peran, userId: pengguna.id, wilayahId, batas: 5 }) : Promise.resolve([]),
    pengguna.peran === 'superadmin' ? ambilAktivitasTerbaru(10) : Promise.resolve([]),
  ]);
  // Tahap 8: jumlah socket tersambung (diagnostik uji k/l) — superadmin saja.
  const jumlahSocket = pengguna.peran === 'superadmin' ? ambilJumlahSocket() : undefined;
  return NextResponse.json({ kartu, tren, pengaduanTerbaru: terbaru, artikelTerbaru: artikel, aktivitas, jumlahSocket }, { headers: { 'cache-control': 'no-store' } });
});
