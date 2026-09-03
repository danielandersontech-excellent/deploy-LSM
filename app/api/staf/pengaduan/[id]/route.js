// GET /api/staf/pengaduan/[id] — detail pengaduan + riwayat + lampiran.
// Identitas pelapor hanya superadmin/verifikator; setiap pembukaan identitas dicatat di audit_log
// (REFERENSI 11 catatan 2). pimpinan_wilayah dibatasi wilayahnya di SQL.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK, bolehLihatIdentitas, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilPengaduan, ambilRiwayat, ambilLampiran } from '@/lib/db/pengaduan';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.pengaduan_lihat, async (request, { params }, pengguna) => {
  const { id } = await params;
  const idAngka = Number(id);
  if (!Number.isInteger(idAngka) || idAngka <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');

  const lihatIdentitas = bolehLihatIdentitas(pengguna.peran);
  const pengaduan = await ambilPengaduan(idAngka, { bolehLihatIdentitas: lihatIdentitas, wilayahId: wilayahTerbatas(pengguna) });
  if (!pengaduan) throw new GalatHttp(404, 'Pengaduan tidak ditemukan', 'TIDAK_DITEMUKAN');

  const [riwayat, lampiran] = await Promise.all([ambilRiwayat(idAngka), ambilLampiran(idAngka)]);
  if (lihatIdentitas && !pengaduan.anonim) {
    await catatAudit({ userId: pengguna.id, aksi: 'lihat_identitas_pelapor', tabelTerkait: 'pengaduan', idTerkait: idAngka, ip: await alamatIpPermintaan(request) });
  }
  return NextResponse.json({ pengaduan, riwayat, lampiran }, { headers: { 'cache-control': 'no-store' } });
});
